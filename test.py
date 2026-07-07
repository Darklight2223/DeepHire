import groq
import os
from dotenv import load_dotenv


load_dotenv()

client = groq.Client(
    api_key=os.getenv("GROQ_API_KEY")
)

model = "llama-3.1-8b-instant"

prompt = "Hello ! How are you?"
response = client.chat.completions.create(
    model=model,
    messages=[
        {"role": "user", "content": prompt}
    ]
)

print(response.choices[0].message.content)