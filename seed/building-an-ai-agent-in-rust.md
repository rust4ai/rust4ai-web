---
slug: building-an-ai-agent-in-rust
title: Building an AI Agent in Rust
excerpt: Learn how to build a tool-using AI agent in Rust that can reason, plan, and execute tasks autonomously.
tags: [agents, tutorial]
featured: true
cover_image_url:
---

# Building an AI Agent in Rust

AI agents are systems that use large language models to reason about tasks, make plans, and execute actions using tools. Rust's strong type system and performance characteristics make it an excellent choice for building reliable agents.

:::ai-image
prompt: An AI agent loop diagram showing Observe, Think, Act, Reflect stages connected in a cycle, with Rust crab mascot in the center, golden circuit board traces on dark background
alt: AI agent observe-think-act-reflect loop
style: technical diagram, circuit board aesthetic, dark navy and gold
:::

## Architecture Overview

A typical AI agent follows a loop:

1. **Observe** — receive input or feedback from the environment
2. **Think** — use an LLM to reason about what to do next
3. **Act** — call a tool or produce output
4. **Reflect** — evaluate the result and decide whether to continue

## Defining Tools

Tools are the capabilities your agent can use. Define them as typed structs:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchTool {
    pub query: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CalculatorTool {
    pub expression: String,
}

pub enum Tool {
    Search(SearchTool),
    Calculator(CalculatorTool),
}
```

## The Agent Loop

```rust
pub async fn run_agent(task: &str) -> Result<String> {
    let mut messages = vec![system_prompt(), user_message(task)];

    loop {
        let response = call_llm(&messages).await?;

        match response.action {
            Action::ToolCall(tool) => {
                let result = execute_tool(tool).await?;
                messages.push(tool_result(result));
            }
            Action::FinalAnswer(answer) => return Ok(answer),
        }
    }
}
```

:::ai-image
prompt: A toolbox opening to reveal typed Rust structs as tools — a search magnifying glass, a calculator, a code terminal — each labeled with Rust type annotations, warm desert lighting
alt: Typed tool definitions for the AI agent
style: isometric illustration, warm tones, clean technical drawing
:::

## Error Handling and Retries

Rust's `Result` type makes error handling explicit. Wrap tool execution in retry logic:

```rust
async fn execute_with_retry(tool: Tool, max_retries: u32) -> Result<String> {
    for attempt in 0..max_retries {
        match execute_tool(&tool).await {
            Ok(result) => return Ok(result),
            Err(e) if attempt < max_retries - 1 => {
                tracing::warn!("Tool failed (attempt {}): {}", attempt + 1, e);
                continue;
            }
            Err(e) => return Err(e),
        }
    }
    unreachable!()
}
```

## Memory and Context Management

For long-running agents, manage context window limits by summarizing older messages:

```rust
fn compress_history(messages: &[Message], max_tokens: usize) -> Vec<Message> {
    if estimate_tokens(messages) <= max_tokens {
        return messages.to_vec();
    }
    let summary = summarize(&messages[..messages.len() - 4]);
    let mut compressed = vec![summary];
    compressed.extend_from_slice(&messages[messages.len() - 4..]);
    compressed
}
```

:::ai-image
prompt: A conveyor belt of messages being compressed into a summary document, with a token counter display, Rust-orange mechanical gears, dark background
alt: Context window compression for long-running agents
style: technical illustration, mechanical, warm industrial tones
:::

## Next Steps

- Add **streaming responses** for real-time output
- Implement **parallel tool execution** for independent actions
- Build a **web interface** to interact with your agent

The Rust ecosystem for AI agents is growing fast. Combining LLM reasoning with Rust's reliability creates agents you can trust in production.
