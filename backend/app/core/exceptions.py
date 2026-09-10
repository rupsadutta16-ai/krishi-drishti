class AppException(Exception):
    def __init__(
        self,
        message: str = "",
        status_code: int = 400,
        detail: str | None = None,
    ):
        msg = detail if detail is not None else message
        self.message = msg
        self.detail = msg
        self.status_code = status_code

        super().__init__(msg)