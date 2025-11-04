from pydantic import BaseModel, Field
from typing import List, Literal, Optional

Role = Literal["user", "assistant", "system"]

class Message(BaseModel):
    role: Role
    content: str

class ChatRequest(BaseModel):
    messages: List[Message] = Field(..., description="Full message history including user query")
    model: str = Field("meta-llama/Llama-3.2-3B-Instruct", description="Hugging Face model ID to use")
    max_new_tokens: int = 2048
    temperature: float = 0.7
    stream: bool = False

class ChatResponse(BaseModel):
    reply: str

class StreamChunk(BaseModel):
    token: str
    complete: bool = False
