import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, questionCount, difficulty, fileFormat } = body

    if (!content || !questionCount || !difficulty || !fileFormat) {
      return NextResponse.json({ error: "Отсутствуют обязательные параметры" }, { status: 400 })
    }

    // Вызываем Python API на том же домене
    const apiUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/generate`
      : "http://localhost:3000/api/generate"

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: content,
        questionCount: questionCount,
        difficulty: difficulty,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()

    return NextResponse.json({
      questions: result.generatedTest
        ? [
            {
              question: "Сгенерированный тест",
              content: result.generatedTest,
            },
          ]
        : [],
      format: fileFormat,
      success: result.success,
    })
  } catch (error) {
    console.error("Ошибка при генерации теста:", error)
    return NextResponse.json(
      {
        error: `Ошибка генерации: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}