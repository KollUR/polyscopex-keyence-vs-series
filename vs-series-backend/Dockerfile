FROM python:3.11-alpine

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY src/vs-rest-api.py .

ENV FLASK_APP="vs-rest-api.py"

EXPOSE 5000

ENTRYPOINT ["flask", "run", "--host", "0.0.0.0", "--port", "5000"]
