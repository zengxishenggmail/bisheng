from typing import Any, Optional, Type

import requests
from langchain_core.pydantic_v1 import BaseModel, Field, root_validator
from loguru import logger

from bisheng_langchain.gpts.tools.api_tools.base import (APIToolBase,
                                                         MultArgsSchemaTool)


class InputArgs(BaseModel):
    url: str = Field(description="钉钉机器人的URL地址")
    message: str = Field(description="需要发送的钉钉消息")


class FeishuMessageTool(BaseModel):

    @classmethod
    def send_message(cls, message: str, url: str) -> "FeishuMessageTool":
        """
        发送钉钉机器人消息
        
        Args:
            webhook_url: 钉钉机器人的 webhook 地址
            message: 要发送的消息内容
        
        Returns:
            dict: 钉钉接口的响应结果
        """
        # 构建请求头
        headers = {"Content-Type": "application/json"}
        # 构建请求体
        data = {"msg_type": "text", "text": {"content": message}}

        try:
            # 发送 POST 请求
            response = requests.post(url=url, headers=headers, json=data)

            # 检查响应状态
            response.raise_for_status()
            return response.json()

        except requests.exceptions.RequestException as e:
            print(f"发送消息失败: {str(e)}")

        return cls()

    @classmethod
    def get_api_tool(cls, name: str, **kwargs: Any) -> "FeishuMessageTool":
        attr_name = name.split("_", 1)[-1]
        class_method = getattr(cls, attr_name)

        return MultArgsSchemaTool(
            name=name,
            description=class_method.__doc__,
            func=class_method,
            args_schema=InputArgs,
        )
