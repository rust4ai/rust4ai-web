---
slug: deploying-ml-models-with-rust
title: Deploying ML Models with Rust
excerpt: A production guide to serving machine learning models as HTTP APIs using Rust, Axum, and ONNX Runtime.
tags: [deployment, onnx, production]
featured: true
cover_image_url:
---

# Deploying ML Models with Rust

You've trained your model in Python — now what? Deploying ML models in production requires low latency, high throughput, and reliability. Rust gives you all three. In this guide, we'll build a model-serving API using Axum and ONNX Runtime.

:::ai-image
prompt: A sleek production server rack with glowing orange neural network connections, Rust gear logo on the side, dark background with warm lighting
alt: Rust-powered ML model serving architecture
style: technical illustration, clean, modern, dark theme
:::

## Why Rust for ML Serving?

Python-based serving (Flask, FastAPI) works for prototyping, but production workloads demand more:

- **Cold start**: Rust binaries start in milliseconds, not seconds
- **Memory**: No GIL, no garbage collector — predictable performance under load
- **Concurrency**: Tokio's async runtime handles thousands of concurrent requests efficiently
- **Single binary**: Deploy one statically-linked binary — no virtualenvs, no pip

## Export Your Model to ONNX

First, export your trained PyTorch model:

```python
import torch

model = load_your_model()
dummy_input = torch.randn(1, 3, 224, 224)
torch.onnx.export(model, dummy_input, "model.onnx", opset_version=17)
```

## Set Up the Rust Project

```bash
cargo new ml-server
cd ml-server
cargo add axum tokio serde serde_json
cargo add ort  # ONNX Runtime bindings for Rust
```

## Load and Run the Model

```rust
use ort::{Environment, Session, Value};
use std::sync::Arc;

pub struct ModelState {
    session: Arc<Session>,
}

impl ModelState {
    pub fn new(model_path: &str) -> anyhow::Result<Self> {
        let env = Environment::builder().build()?;
        let session = Session::builder(&env)?
            .with_model_from_file(model_path)?;
        Ok(Self { session: Arc::new(session) })
    }

    pub fn predict(&self, input: Vec<f32>) -> anyhow::Result<Vec<f32>> {
        let input_tensor = Value::from_array(([1, 3, 224, 224], &input))?;
        let outputs = self.session.run(vec![input_tensor])?;
        let output: Vec<f32> = outputs[0].try_extract()?.to_vec();
        Ok(output)
    }
}
```

:::ai-image
prompt: An API request-response flow diagram showing HTTP requests flowing into a Rust Axum server, hitting an ONNX model, and returning predictions, desert color scheme with golden arrows
alt: Request flow through the ML serving API
style: architectural diagram, minimal, warm tones
:::

## Build the API

```rust
use axum::{extract::State, Json, Router, routing::post};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct PredictRequest {
    input: Vec<f32>,
}

#[derive(Serialize)]
struct PredictResponse {
    predictions: Vec<f32>,
    latency_ms: f64,
}

async fn predict(
    State(model): State<Arc<ModelState>>,
    Json(req): Json<PredictRequest>,
) -> Json<PredictResponse> {
    let start = std::time::Instant::now();
    let predictions = model.predict(req.input).unwrap();
    Json(PredictResponse {
        predictions,
        latency_ms: start.elapsed().as_secs_f64() * 1000.0,
    })
}
```

## Performance Tips

### 1. Use a thread pool for inference

ONNX Runtime inference is CPU-bound. Don't block the async runtime:

```rust
async fn predict_async(model: Arc<ModelState>, input: Vec<f32>) -> Vec<f32> {
    tokio::task::spawn_blocking(move || model.predict(input).unwrap())
        .await
        .unwrap()
}
```

### 2. Enable batching

Collect requests and batch them for better GPU utilization:

```rust
// Collect up to 32 requests or wait 5ms, whichever comes first
let batch = collector.collect(32, Duration::from_millis(5)).await;
let results = model.predict_batch(batch)?;
```

### 3. Health checks and graceful shutdown

```rust
app.route("/healthz", get(|| async { "ok" }));
```

:::ai-image
prompt: A minimal Docker container diagram showing a tiny Rust binary next to a large Python container, size comparison visualization, clean infographic style
alt: Docker image size comparison between Rust and Python
style: infographic, clean, comparison chart, warm desert palette
:::

## Deployment

Build a minimal Docker image:

```dockerfile
FROM rust:1.80 AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=builder /app/target/release/ml-server /usr/local/bin/
COPY model.onnx /app/model.onnx
CMD ["ml-server"]
```

The final image is under 100MB — compare that to a Python serving image at 2-3GB.

## Conclusion

Rust is becoming a serious option for ML model serving. The combination of Axum for HTTP, ONNX Runtime for inference, and Tokio for async gives you a production-grade stack that's fast, reliable, and easy to deploy.
