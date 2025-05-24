"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, Download, AlertCircle, CheckCircle } from "lucide-react"

export default function TestGenerator() {
  // Состояния формы
  const [text, setText] = useState("")
  const [questionCount, setQuestionCount] = useState(7)
  const [difficulty, setDifficulty] = useState("easy") // easy, medium, hard
  const [format, setFormat] = useState("txt") // txt, pdf

  // Состояния процесса
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [generatedTest, setGeneratedTest] = useState("")
  const [downloadUrl, setDownloadUrl] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Реф для загрузки файла
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Обработка загрузки файла
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Ошибка загрузки файла")
      }

      if (data.success && data.text) {
        setText(data.text)
        setSuccess(`Файл "${data.filename}" успешно загружен (${data.length} символов)`)
      }
    } catch (error) {
      console.error("Ошибка загрузки:", error)
      setError(error instanceof Error ? error.message : "Ошибка загрузки файла")
    } finally {
      setIsUploading(false)
      // Очищаем input для возможности повторной загрузки того же файла
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Генерация теста
  const generateTest = async () => {
    if (!text.trim()) {
      setError("Пожалуйста, введите текст или загрузите файл")
      return
    }

    setIsGenerating(true)
    setGeneratedTest("")
    setDownloadUrl("")
    setError("")
    setSuccess("")

    try {
      const response = await fetch("http://localhost:8000/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          questionCount,
          difficulty,
          format,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Ошибка генерации теста")
      }

      if (data.success) {
        setGeneratedTest(data.generatedTest)
        if (data.downloadUrl) {
          setDownloadUrl(`http://localhost:8000${data.downloadUrl}`)
        }
        setSuccess("Тест успешно сгенерирован!")
      } else {
        throw new Error(data.message || "Неизвестная ошибка")
      }
    } catch (error) {
      console.error("Ошибка генерации:", error)
      let errorMessage = "Произошла ошибка при генерации теста"

      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          errorMessage = "Не удается подключиться к серверу. Убедитесь, что API сервер запущен на порту 8000."
        } else {
          errorMessage = error.message
        }
      }

      setError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  // Получение текста сложности
  const getDifficultyText = (value: number) => {
    switch (value) {
      case 0:
        return "Легкий"
      case 1:
        return "Средний"
      case 2:
        return "Сложный"
      default:
        return "Легкий"
    }
  }

  // Получение значения сложности для API
  const getDifficultyValue = (sliderValue: number) => {
    switch (sliderValue) {
      case 0:
        return "easy"
      case 1:
        return "medium"
      case 2:
        return "hard"
      default:
        return "easy"
    }
  }

  const [difficultySlider, setDifficultySlider] = useState([0]) // Для слайдера

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold mb-2">Задайте параметры для генерации теста</CardTitle>
            <CardDescription className="text-lg">
              Создавайте тесты на основе учебных материалов с помощью ИИ
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* 1. Ввод текста или загрузка файла */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">1. Введите текст или перетащите файл</h3>

              <div className="space-y-4">
                <Textarea
                  placeholder="Введите учебный материал здесь..."
                  className="min-h-[200px] text-base"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value)
                    if (error) setError("")
                    if (success) setSuccess("")
                  }}
                />

                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {isUploading ? "Загружаем..." : "Загрузить файл"}
                  </Button>

                  <span className="text-sm text-gray-500">Поддерживаются: TXT, PDF, DOC, DOCX</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="text-sm text-gray-500">Символов: {text.length} / рекомендуется 200-2000</div>
              </div>
            </div>

            {/* 2. Количество вопросов */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">2. Укажите количество вопросов в тесте</h3>
              <Input
                type="number"
                min="1"
                max="20"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value) || 7)}
                className="text-base"
                placeholder="Количество вопросов"
              />
            </div>

            {/* 3. Сложность */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">3. Выберите сложность</h3>

              <div className="space-y-4">
                <Slider
                  value={difficultySlider}
                  onValueChange={(value) => {
                    setDifficultySlider(value)
                    setDifficulty(getDifficultyValue(value[0]))
                  }}
                  max={2}
                  step={1}
                  className="w-full"
                />

                <div className="flex justify-between text-sm font-medium">
                  <span className={difficultySlider[0] === 0 ? "text-green-600 font-bold" : "text-gray-500"}>
                    Легкий
                  </span>
                  <span className={difficultySlider[0] === 1 ? "text-yellow-600 font-bold" : "text-gray-500"}>
                    Средний
                  </span>
                  <span className={difficultySlider[0] === 2 ? "text-red-600 font-bold" : "text-gray-500"}>
                    Сложный
                  </span>
                </div>

                <div className="text-center text-lg font-semibold">
                  Выбрано: {getDifficultyText(difficultySlider[0])}
                </div>
              </div>
            </div>

            {/* 4. Формат файла */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">4. Выберите формат файла</h3>

              <RadioGroup value={format} onValueChange={setFormat} className="flex gap-8">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="txt" id="txt" />
                  <Label htmlFor="txt" className="text-base font-medium cursor-pointer">
                    txt
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="text-base font-medium cursor-pointer">
                    pdf
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Сообщения об ошибках и успехе */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Кнопка генерации */}
            <div className="flex justify-center pt-6">
              <Button
                onClick={generateTest}
                disabled={isGenerating || !text.trim()}
                size="lg"
                className="px-12 py-3 text-lg font-semibold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Генерируем...
                  </>
                ) : (
                  "Сгенерировать"
                )}
              </Button>
            </div>

            {/* Результат */}
            {generatedTest && (
              <div className="space-y-4 pt-8 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Сгенерированный тест</h3>
                  {downloadUrl && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(downloadUrl, "_blank")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Скачать {format.toUpperCase()}
                    </Button>
                  )}
                </div>

                <div className="bg-gray-50 border rounded-lg p-6">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">{generatedTest}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
