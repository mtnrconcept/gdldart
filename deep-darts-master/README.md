# DeepDarts

Code for the CVSports 2021 paper: [DeepDarts: Modeling Keypoints as Objects for Automatic Scorekeeping in Darts using a Single Camera](https://arxiv.org/abs/2105.09880)

## Prerequisites
Python 3.5-3.8, CUDA >= 10.1, cuDNN >= 7.6

## Setup
1. [Install Anaconda or Miniconda](https://docs.conda.io/projects/conda/en/latest/user-guide/install/index.html)
2. Create a new conda environment with Python 3.7: ```$ conda create -n deep-darts python==3.7```. Activate the environment: ```$ conda activate deep-darts```
4. Clone this repo: ```$ git clone https://github.com/wmcnally/deep-darts.git```
5. Go into the directory and install the dependencies (TensorFlow 2.3, FastAPI, etc.): ```$ cd deep-darts && pip install -r requirements.txt```
6. Download ```images.zip``` from [IEEE Dataport](https://ieee-dataport.org/open-access/deepdarts-dataset)
   and extract in the ```dataset``` directory. Crop the images: ```$ python crop_images.py --size 800```. This step could
   take a while. Alternatively, you can download the 800x800 cropped images directly from IEEE Dataport. 
   If you choose this option, extract ```cropped_images.zip``` in the ```dataset``` directory.
8. Download ```models.zip``` from IEEE Dataport and extract in the main directory. The API server expects to find trained weights in `models/<config>/weights` (e.g. `models/deepdarts_d1/weights`). You can also provide an absolute path via the `DEEP_DARTS_WEIGHTS` environment variable.

## REST API server

This repository now includes a FastAPI service (`serve.py`) that exposes the dart detection pipeline over HTTP.

### Configuration

The server loads a YOLOv4-tiny model using the same configuration files as the training scripts. You can customise its behaviour with the following environment variables:

- `DEEP_DARTS_CONFIG` – configuration name (defaults to `deepdarts_d1`).
- `DEEP_DARTS_CONFIG_PATH` – explicit path to a YAML configuration file.
- `DEEP_DARTS_MODEL_NAME` – overrides `cfg.model.name` when different from the configuration name.
- `DEEP_DARTS_WEIGHTS` – path to the trained weights to load (defaults to `models/<config>/weights`).
- `DEEP_DARTS_MAX_DARTS` – maximum number of darts returned (defaults to 3).

### Run locally

After installing the Python requirements and downloading the weights, start the service with:

```bash
uvicorn serve:app --host 0.0.0.0 --port 8000
```

The `/api/detect` endpoint accepts a JSON payload `{ "image": "data:image/jpeg;base64,..." }` and returns detections in the form:

```json
{
  "detections": [
    {
      "x": 0.51,
      "y": 0.38,
      "score": 40,
      "baseScore": 20,
      "multiplier": "double",
      "ring": "double",
      "sector": "Double 20",
      "confidence": 0.92,
      "normalized": true
    }
  ]
}
```

All coordinates are normalised (`[0, 1]`). Confidence is included when available from the YOLO predictions.

When testing the Expo application locally, point it to the service with:

```bash
EXPO_PUBLIC_DART_DETECTION_URL=http://localhost:8000/api/detect npx expo start
```

### Docker example

You can also launch the API via Docker (assuming the current directory contains the downloaded weights):

```bash
docker run --rm -it \
  -p 8000:8000 \
  -v "$(pwd)":/app \
  -w /app/deep-darts-master \
  python:3.8-slim bash -c "pip install -r requirements.txt && uvicorn serve:app --host 0.0.0.0 --port 8000"
```

Mount additional directories or set the `DEEP_DARTS_WEIGHTS` environment variable if your weights are stored elsewhere.

## Validation / Testing
To test the Dataset 1 model:\
```$ python predict.py --cfg deepdarts_d1 --split test```


To test the Dataset 2 model and write the prediction images: \
```$ python predict.py --cfg deepdarts_d2 --split test --write```


## Training
To train the Dataset 1 model:\
```$ python train.py --cfg deepdarts_d1```

To train the Dataset 2 model:\
```$ python train.py --cfg deepdarts_d2```

You may need to adjust the batch sizes to fit your total GPU memory. The default batch sizes are for 24 GB total GPU memory.

## Sample Test Predictions

Dataset 1:\
![alt text](./d1_pred.JPG)

Dataset 2:\
![alt text](./d2_pred.JPG)



