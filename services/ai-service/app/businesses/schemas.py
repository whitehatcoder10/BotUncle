from pydantic import BaseModel, Field


class CreateBusinessRequest(BaseModel):
    name: str = Field(min_length=1, max_length=128)


class BusinessResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    widget_key: str
    allowed_domains: list[str]
    widget_config: str
