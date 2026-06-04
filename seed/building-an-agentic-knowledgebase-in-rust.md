---
slug: building-an-agentic-knowledgebase-in-rust
title: Building an Agentic Knowledgebase in Rust with Solarabase
excerpt: How Solarabase turns documents into LLM-generated tree indexes and lets an AI agent navigate them with tools — a different take on RAG, built entirely in Rust.
tags: [agents, rag, knowledgebase, rust]
featured: true
cover_image_url:
---

# Building an Agentic Knowledgebase in Rust with Solarabase

Most retrieval-augmented generation (RAG) systems follow the same recipe: chop a document into fixed-size chunks, embed each chunk, and at query time return the top-_k_ chunks by cosine similarity. It works — until it doesn't. Similarity search has no idea what a document _means_, only what its vectors are close to. Ask a question whose answer is spread across three pages, and you'll often get one good chunk and two near-misses.

[**Solarabase**](https://github.com/rust4ai/solarabase-monorepo) takes a different approach, and it's built entirely in Rust.

:::ai-image
prompt: A hierarchical document tree being navigated by a small Rust crab mascot holding a lantern, glowing index nodes branching out like a knowledge map, dark navy background with warm amber highlights
alt: An agent navigating a hierarchical document tree index
style: technical illustration, warm amber and navy, clean isometric
:::

## The Idea: Index Trees, Not Chunks

Instead of chunk-and-embed, Solarabase builds a **PageIndex** for every document — an LLM-generated hierarchical tree that describes what the document contains, page by page. Each page gets its own tree node, and the document gets a root index summarizing the whole thing.

Retrieval then becomes _navigation_ rather than _similarity_. A per-knowledgebase AI agent is handed a small set of tools:

- `list_docs` — see what documents exist in this knowledgebase
- `search_index` — search the tree index for relevant pages
- `read_page` — pull the full text of a specific page

The agent reasons its way to the answer the way a person would skim a table of contents, jump to the right section, and read it — instead of trusting a vector distance to land in the right place.

## Multi-Tenancy Done in Rust

Solarabase is Knowledgebase-as-a-Service, so isolation matters. The data model is a clean three-level hierarchy:

```
Workspace  →  Knowledgebase  →  Documents
```

Every query is scoped by `kb_id`, enforced by a `KbAccess` extractor that accepts either workspace membership (via Google OAuth + JWT cookie) **or** a per-knowledgebase API key. The Rust type system makes this hard to get wrong: a handler that needs KB access simply takes the extractor as an argument, and the request never reaches the body if access fails.

```
User → Google OAuth → JWT Cookie → Axum API
                                      |
                              KbAccess extractor
                          (workspace membership OR API key)
                                      |
                              Per-KB RagAgent (cached)
```

## The Indexer and the Cache

Two pieces of infrastructure make this practical at scale:

- **The indexer** is a background worker that processes all pending documents globally. When you upload a file, it's queued; the worker builds the per-page tree nodes and the root document index via the LLM, then marks the document ready.
- **The RagCache** is an LRU cache of `Arc<RagAgent>` keyed by knowledgebase, evicted after 30 minutes of inactivity. Spinning up an agent per request would be wasteful, so the hot path reuses a cached, ready-to-query agent.

Rust's ownership model makes the cache cheap and safe — `Arc` sharing means many concurrent requests can hold the same agent without copying or locking the underlying state.

## Plug It Into Your Own Agent

Here's the part that makes Solarabase composable rather than a walled garden: the `/api/kb/:id/retrieve` endpoint returns RAG context **without** LLM synthesis. You get the relevant pages back and do whatever you want with them.

```bash
curl -X POST https://your-solarabase/api/kb/$KB_ID/retrieve \
  -H "Authorization: Bearer sb_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is our refund policy?"}'
```

Feed those pages straight into your own prompt, or let Solarabase's built-in agent synthesize the answer for you. The API keys (`sb_live_*`) are scoped to a single knowledgebase and SHA-256 hashed, shown exactly once on creation.

## Why Rust?

An agentic knowledgebase is a concurrency-heavy workload: background indexing, cached agents, many simultaneous queries, billing checks on every request. Rust gives you fearless concurrency, no garbage-collector pauses, and compile-time guarantees that the multi-tenant boundaries hold. The whole backend runs on **Axum + SQLx + PostgreSQL**, with a React + Tailwind frontend and Stripe billing — a single deployable image.

## Try It

Solarabase is open source. Check out the monorepo, read the architecture docs, and spin up your own agentic knowledgebase:

- [Solarabase on GitHub](https://github.com/rust4ai/solarabase-monorepo)

The combination of LLM-built tree indexes and tool-driven navigation is a genuinely different answer to the RAG problem — and Rust is what makes it fast, safe, and cheap to run.
