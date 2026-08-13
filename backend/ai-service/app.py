from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from mobile_sam import (
    sam_model_registry,
    SamPredictor
)

from PIL import Image

import numpy as np
import io
import json
import torch


app = FastAPI(
    title="Smart Wall Paint AI Service"
)


# ==========================
# MOBILE SAM CONFIG
# ==========================

MODEL_PATH = "models/mobile_sam.pt"


sam = None
predictor = None


def load_model():

    global sam
    global predictor

    if sam is None:

        print("Loading MobileSAM model...")

        sam = sam_model_registry["vit_t"](
            checkpoint=MODEL_PATH
        )

        sam.to(device="cpu")

        predictor = SamPredictor(sam)

        print("MobileSAM Model Loaded Successfully")



# ==========================
# CACHE
# ==========================

cached_file_name = None
cached_original_size = None



# ==========================
# CORS
# ==========================

app.add_middleware(

    CORSMiddleware,

    allow_origins=[
        "http://localhost:4200",
        "https://smart-wall-paint-visualizer-kappa.vercel.app"
        "https://smart-wall-paint-visualizer-girmlvqtn-student-9180.vercel.app"
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

        "message":
        "MobileSAM AI Segmentation Service Running"

    }



# ==========================
# MULTI POINT SEGMENTATION
# ==========================

@app.post("/segment-point")
async def segment_point(

    file: UploadFile = File(...),

    points: str = Form(...)

):

    global cached_file_name
    global cached_original_size


    # Load model only when required

    load_model()



    # ==========================
    # LOAD IMAGE
    # ==========================

    if cached_file_name != file.filename:


        image_bytes = await file.read()


        image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")


        cached_original_size = image.size


        sam_image = image.resize(
            (1024,576)
        )


        image_array = np.array(
            sam_image
        )


        predictor.set_image(
            image_array
        )


        cached_file_name = file.filename


        print(
            "MobileSAM image loaded"
        )


    else:

        print(
            "Using cached image"
        )



    original_width, original_height = cached_original_size



    # ==========================
    # CONVERT POINTS
    # ==========================

    user_points = json.loads(points)


    sam_points = []


    for point in user_points:


        x = int(
            point[0] * 1024 / original_width
        )


        y = int(
            point[1] * 576 / original_height
        )


        sam_points.append(
            [
                x,
                y
            ]
        )


    print(
        "MobileSAM Points:",
        sam_points
    )



    input_points = np.array(
        sam_points
    )


    input_labels = np.ones(

        len(sam_points),

        dtype=np.int32

    )



    # ==========================
    # PREDICT MASK
    # ==========================

    with torch.no_grad():

        masks, scores, logits = predictor.predict(

            point_coords=input_points,

            point_labels=input_labels,

            multimask_output=True

        )



    # ==========================
    # FILTER MASKS
    # ==========================

    image_area = 1024 * 576

    valid_masks = []



    for i, mask in enumerate(masks):


        mask_area = np.sum(mask)


        area_ratio = mask_area / image_area


        print(

            "Mask:",
            i,

            "Score:",
            float(scores[i]),

            "Area:",
            float(area_ratio)

        )


        if 0.01 < area_ratio < 0.35:

            valid_masks.append(i)



    # ==========================
    # BEST MASK
    # ==========================

    if len(valid_masks) > 0:


        best_index = max(

            valid_masks,

            key=lambda x: scores[x]

        )


    else:


        best_index = int(

            np.argmax(scores)

        )



    selected_mask = masks[best_index]


    mask_array = (

        selected_mask

        .astype(np.uint8)

        .tolist()

    )


    print(

        "Best Score:",
        float(scores[best_index])

    )


    return {


        "success": True,


        "points": user_points,


        "mask_size": {

            "width":1024,

            "height":576

        },


        "score":float(

            scores[best_index]

        ),


        "mask":mask_array,


        "message":

        "MobileSAM mask generated successfully"

    }