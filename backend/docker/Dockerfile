FROM python:3.12.2

WORKDIR /app

# COPY src des # src, des relative to dir where u run docker build
COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["uvicorn", "app.app:app", "--host", "0.0.0.0", "--port", "8080"]