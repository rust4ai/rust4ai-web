---
slug: getting-started-with-burn
title: Getting Started with Burn
excerpt: A hands-on guide to building your first neural network in Rust with the Burn framework.
tags: [burn, tutorial]
featured: true
cover_image_url:
---

# Getting Started with Burn

Burn is a deep learning framework written entirely in Rust, designed for performance, flexibility, and ease of use. In this guide, we'll walk through building your first neural network from scratch.

:::ai-image
prompt: A friendly beginner-oriented illustration of a neural network being assembled like building blocks, with Rust gear logo, warm golden lighting on dark background, welcoming feel
alt: Getting started with Burn neural network framework
style: friendly technical illustration, building blocks, warm tones
:::

## Why Burn?

Rust's type system and memory safety guarantees make it an excellent choice for machine learning workloads. Burn leverages these properties to provide:

- **Compile-time shape checking** — catch tensor dimension mismatches before runtime
- **Multiple backends** — switch between CPU, CUDA, and WebGPU without changing your model code
- **No garbage collector** — predictable performance with zero-cost abstractions

## Setting Up Your Project

```bash
cargo new my-first-model
cd my-first-model
cargo add burn --features wgpu
```

## Defining a Model

Burn uses a derive macro to define model architectures:

```rust
use burn::prelude::*;
use burn::nn;

#[derive(Module, Debug)]
pub struct MnistModel<B: Backend> {
    linear1: nn::Linear<B>,
    linear2: nn::Linear<B>,
    activation: nn::Relu,
}
```

:::ai-image
prompt: A layered neural network architecture diagram showing input layer, two linear layers with ReLU activation, and output layer, annotated with Rust type signatures, clean technical style
alt: MNIST model architecture with two linear layers
style: architecture diagram, clean lines, annotated, desert color scheme
:::

## Building the Forward Pass

```rust
impl<B: Backend> MnistModel<B> {
    pub fn forward(&self, input: Tensor<B, 2>) -> Tensor<B, 2> {
        let x = self.linear1.forward(input);
        let x = self.activation.forward(x);
        self.linear2.forward(x)
    }
}
```

## Training Loop

Burn provides a `Learner` abstraction that handles the training loop, logging, and checkpointing:

```rust
let learner = LearnerBuilder::new("./artifacts")
    .with_optimizer(AdamConfig::new())
    .with_num_epochs(10)
    .build(model, dataloader_train, dataloader_test);

let trained = learner.fit();
```

:::ai-image
prompt: A training progress dashboard showing loss curve decreasing over epochs, accuracy climbing, with checkpoints saved along the way, dark dashboard UI with golden accent charts
alt: Burn training loop with loss curve and checkpoints
style: dashboard UI mockup, dark theme, golden data visualization
:::

## What's Next?

- Explore **convolutional layers** for image classification
- Try the **WGPU backend** for GPU-accelerated training
- Check out Burn's built-in **dataset utilities** for data loading

Burn is rapidly evolving and is one of the most promising ML frameworks in the Rust ecosystem. Start experimenting today!
