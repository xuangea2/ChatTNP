from functools import lru_cache
from threading import Lock
from transformers import pipeline, TextIteratorStreamer
import torch
from typing import List, Dict, Any, Iterator
from huggingface_hub import login
import os
from dotenv import load_dotenv
load_dotenv()

# take HUGGINGFACE_HUB_TOKEN from .env
login(os.getenv("HUGGINGFACE_HUB_TOKEN"))

DEFAULT_MODEL_ID = "meta-llama/Llama-3.2-3B-Instruct"
_lock = Lock()
_pipes: Dict[str, any] = {}


def get_pipeline(model_id: str = DEFAULT_MODEL_ID):
    global _pipes
    if model_id not in _pipes:
        with _lock:
            if model_id not in _pipes:
                _pipes[model_id] = pipeline(
                    "text-generation",
                    model=model_id,
                    torch_dtype="auto",
                    device_map="auto",
                )
    return _pipes[model_id]


def generate(messages: List[Dict[str, str]], max_new_tokens: int = 512, temperature: float = 0.7, model_id: str = DEFAULT_MODEL_ID) -> str:
    pipe = get_pipeline(model_id)
    outputs = pipe(messages, max_new_tokens=max_new_tokens, temperature=temperature)
    # HF chat pipeline returns list of dict; final message is outputs[0]["generated_text"][-1]
    return outputs[0]["generated_text"][-1]["content"]


def stream_generate(messages: List[Dict[str, str]], max_new_tokens: int = 512, temperature: float = 0.7, model_id: str = DEFAULT_MODEL_ID) -> Iterator[str]:
    pipe = get_pipeline(model_id)
    streamer = TextIteratorStreamer(pipe.tokenizer, skip_prompt=True, skip_special_tokens=True)

    def _run():
        pipe(
            messages,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            streamer=streamer,
        )

    import threading
    t = threading.Thread(target=_run)
    t.start()
    for token in streamer:
        yield token
