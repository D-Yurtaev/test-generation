from http.server import BaseHTTPRequestHandler
import json
import os
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import torch

class handler(BaseHTTPRequestHandler):
    # Глобальные переменные для модели
    model = None
    tokenizer = None
    
    @classmethod
    def load_model(cls):
        if cls.model is None:
            try:
                print("🔄 Загружаем модель...")
                
                # Загружаем базовую модель
                base_model_name = "ai-forever/rugpt3small_based_on_gpt2"
                cls.tokenizer = AutoTokenizer.from_pretrained(base_model_name)
                
                base_model = AutoModelForCausalLM.from_pretrained(
                    base_model_name,
                    torch_dtype=torch.float32,  # Используем float32 для стабильности
                    low_cpu_mem_usage=True
                )
                
                # Загружаем ваш адаптер
                cls.model = PeftModel.from_pretrained(base_model, "./final_model")
                cls.model.eval()
                
                print("✅ Модель загружена успешно!")
                return True
                
            except Exception as e:
                print(f"❌ Ошибка загрузки модели: {e}")
                return False
        return True

    def do_POST(self):
        if self.path == '/api/generate':
            try:
                # Загружаем модель при первом запросе
                if not self.load_model():
                    self.send_error(500, "Модель не загружена")
                    return
                
                # Читаем запрос
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                text = data.get('text', '')
                question_count = data.get('questionCount', 5)
                difficulty = data.get('difficulty', 'легкий')
                
                # Создаем промпт для генерации
                prompt = f"Создай тест с {question_count} вопросами сложности '{difficulty}' по следующему тексту:\n\n{text}\n\nТест:"
                
                # Токенизируем
                inputs = self.tokenizer(
                    prompt, 
                    return_tensors="pt", 
                    max_length=512, 
                    truncation=True
                )
                
                # Генерируем
                with torch.no_grad():
                    outputs = self.model.generate(
                        inputs.input_ids,
                        max_length=1024,
                        num_beams=3,
                        temperature=0.8,
                        do_sample=True,
                        pad_token_id=self.tokenizer.eos_token_id,
                        repetition_penalty=1.2
                    )
                
                # Декодируем результат
                generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                
                # Убираем промпт из ответа
                result = generated_text.replace(prompt, "").strip()
                
                if not result:
                    result = "Не удалось сгенерировать тест. Попробуйте другой текст."
                
                # Отправляем ответ
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {
                    "success": True,
                    "generatedTest": result,
                    "message": "Тест сгенерирован успешно"
                }
                
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
                
            except Exception as e:
                print(f"❌ Ошибка генерации: {e}")
                self.send_error(500, f"Ошибка генерации: {str(e)}")
        else:
            self.send_error(404, "Not Found")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()