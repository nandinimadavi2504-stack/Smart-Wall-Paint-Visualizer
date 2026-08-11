from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from segment_anything import (
    sam_model_registry,
    SamAutomaticMaskGenerator,
    SamPredictor
)

from PIL import Image

import numpy as np
import io
import json


app = FastAPI(
    title="Smart Wall Paint AI Service"
)


# ==========================
# LOAD SAM MODEL
# ==========================

MODEL_PATH = "sam_vit_b_01ec64.pth"


sam = sam_model_registry["vit_b"](
    checkpoint=MODEL_PATH
)


print("SAM Model Loaded Successfully")



# ==========================
# AUTOMATIC MASK GENERATOR
# ==========================

mask_generator = SamAutomaticMaskGenerator(

    model=sam,

    points_per_side=8,

    pred_iou_thresh=0.88,

    stability_score_thresh=0.95,

    crop_n_layers=0
)



# ==========================
# POINT PREDICTOR
# ==========================

predictor = SamPredictor(sam)



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
        "http://localhost:4200"
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
        "AI Segmentation Service Running"

    }



# ==========================
# AUTOMATIC SEGMENTATION
# ==========================

@app.post("/segment")
async def segment_image(

    file: UploadFile = File(...)

):

    image_bytes = await file.read()


    image = Image.open(
        io.BytesIO(image_bytes)
    ).convert("RGB")


    image = image.resize(
        (512,288)
    )


    image_array = np.array(
        image
    )


    print(
        "Generating masks..."
    )


    masks = mask_generator.generate(
        image_array
    )


    print(
        "Total segments:",
        len(masks)
    )


    return {

        "success": True,

        "number_of_segments": len(masks)

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
            "SAM image loaded"
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
        "SAM Points:",
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
    # SAM PREDICTION
    # ==========================

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


        # Remove full room/wall masks

        if 0.01 < area_ratio < 0.35:

            valid_masks.append(i)



    # ==========================
    # SELECT BEST MASK
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

            "width": 1024,

            "height": 576

        },


        "score": float(

            scores[best_index]

        ),


        "mask": mask_array,


        "message":

        "Multi point mask generated successfully"

    }