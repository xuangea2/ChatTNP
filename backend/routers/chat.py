from fastapi import APIRouter, HTTPException
from typing import Iterator

from backend.services.schemas import ChatRequest, ChatResponse
from backend.services import model

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    try:
        reply = model.generate([
            {"role": m.role, "content": m.content} for m in body.messages
        ], max_new_tokens=body.max_new_tokens, temperature=body.temperature, model_id=body.model)
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
async def chat_stream(body: ChatRequest):
    def token_iter() -> Iterator[str]:
        try:
            for token in model.stream_generate([
                {"role": m.role, "content": m.content} for m in body.messages
            ], max_new_tokens=body.max_new_tokens, temperature=body.temperature, model_id=body.model):
                yield token
        except Exception as e:
            yield f"[ERROR] {e}"

    from fastapi.responses import StreamingResponse
    return StreamingResponse(token_iter(), media_type="text/plain")
