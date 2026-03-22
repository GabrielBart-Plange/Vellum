import ollama
import asyncio

async def test_classification():
    prompt = """
    Categorize this message as BUG_REPORT, FEATURE_REQUEST, or GENERAL_CHAT. 
    Return ONLY the category.
    
    MESSAGE: "The inventory system is broken, items disappear."
    """
    try:
        response = await asyncio.to_thread(
            ollama.generate, 
            model="tinyllama", 
            prompt=prompt
        )
        print(f"Result: {response['response'].strip().upper()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_classification())
