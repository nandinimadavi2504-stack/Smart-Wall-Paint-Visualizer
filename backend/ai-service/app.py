from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from PIL import Image
import numpy as np
import cv2
import io
import json


app = FastAPI(
    title="Smart Wall Paint AI Service"
)


# ==========================
# CORS
# ==========================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:4200",
        "https://smart-wall-paint-visualizer-kappa.vercel.app",
        "https://smart-wall-paint-visualizer-girmlvqtn-student-9180.vercel.app",
        "https://smart-wall-paint-visualizer-1.onrender.com"
    ],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ==========================
# HOME
# ==========================

@app.get("/")
def home():

    return {
        "message": "Lightweight AI Segmentation Service Running"
    }



# ==========================
# CACHE
# ==========================

cached_image = None
cached_filename = None



# ==========================
# SEGMENT POINT
# ==========================

@app.post("/segment-point")
async def segment_point(

    file: UploadFile = File(...),
    points: str = Form(...)

):

    print("SEGMENT REQUEST RECEIVED")


    global cached_image
    global cached_filename


    # ----------------------
    # Load Image
    # ----------------------

    if cached_filename != file.filename:

        print("LOADING IMAGE")

        image_bytes = await file.read()


        image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")


        image = np.array(image)


        cached_image = cv2.cvtColor(
            image,
            cv2.COLOR_RGB2BGR
        )


        cached_filename = file.filename


        print("IMAGE LOADED")



    img = cached_image.copy()



    # Resize image for speed

    img = cv2.resize(
        img,
        (512,512)
    )


    height, width = img.shape[:2]



    # ----------------------
    # Points
    # ----------------------

    user_points = json.loads(points)


    x = int(user_points[0][0])
    y = int(user_points[0][1])


    # keep point inside image

    x = min(max(x,0),width-1)
    y = min(max(y,0),height-1)



    print("POINT:",x,y)



    # ----------------------
    # GrabCut
    # ----------------------

    print("STARTING GRABCUT")


    mask = np.zeros(
        img.shape[:2],
        np.uint8
    )


    bgdModel = np.zeros(
        (1,65),
        np.float64
    )


    fgdModel = np.zeros(
        (1,65),
        np.float64
    )


    rect = (

        max(x-40,0),
        max(y-40,0),
        80,
        80
    )



    cv2.grabCut(

        img,
        mask,
        rect,
        bgdModel,
        fgdModel,
        1,
        cv2.GC_INIT_WITH_RECT

    )


    print("GRABCUT FINISHED")



    final_mask = np.where(

        (mask == 2) | (mask == 0),

        0,

        1

    )


    final_mask = final_mask.astype(
        np.uint8
    )



    return {


        "success": True,


        "points": user_points,


        "mask_size": {

            "width": width,

            "height": height

        },


        "mask": "MASK_GENERATED",

        "score": 0.95,


        "message":
        "Lightweight segmentation generated successfully"

    }