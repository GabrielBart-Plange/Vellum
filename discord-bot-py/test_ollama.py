import ollama
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OllamaTest")

def test_ollama():
    try:
        logger.info("Checking connection to Ollama server...")
        models = ollama.list()
        logger.info(f"Available models: {models}")
        
        # Check if mistral is there
        has_mistral = any(m['name'].startswith('mistral') for m in models.get('models', []))
        if not has_mistral:
            logger.info("Mistral not found. Attempting to pull...")
            # ollama.pull('mistral') # This might be slow, better to do in background or tell user
            return "PULL_REQUIRED"
        return "SUCCESS"
    except Exception as e:
        logger.error(f"Failed to connect to Ollama: {e}")
        return str(e)

if __name__ == "__main__":
    result = test_ollama()
    print(f"RESULT: {result}")
