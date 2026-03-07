import Link from "next/link";

const HALL_IDS = ["elena", "darya"] as const;

export function generateStaticParams() {
  return HALL_IDS.map((id) => ({ id }));
}

export const dynamicParams = false;

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const halls: Record<
    string,
    { name: string; achievements: { date: string; text: string }[] }
  > = {
    elena: {
      name: "Елена",
      achievements: [
        { date: "01.03.2026", text: "Стабильно удерживает лидерство на сцене." },
        { date: "24.02.2026", text: "Закрыла самый сложный креативный спринт." },
        { date: "18.02.2026", text: "Показала лучший перформанс месяца." },
        { date: "11.02.2026", text: "Довела новый формат презентаций до продакшена." },
        { date: "05.02.2026", text: "Получила награду за артистизм." },
        { date: "29.01.2026", text: "Собрала максимум откликов от аудитории." },
        { date: "19.01.2026", text: "Успешно наставляла новую команду." },
        { date: "08.01.2026", text: "Закрепила рекорд по качеству выступлений." },
        { date: "27.12.2025", text: "Закрыла год с лучшими итоговыми метриками." },
      ],
    },
    darya: {
      name: "Дарья",
      achievements: [
        { date: "03.03.2026", text: "Открыла сезон ярким премьерным выступлением." },
        { date: "26.02.2026", text: "Подготовила и представила новый театральный номер." },
        { date: "17.02.2026", text: "Получила высокие оценки за сценическую подачу." },
        { date: "09.02.2026", text: "Успешно провела серию сложных репетиций." },
        { date: "31.01.2026", text: "Улучшила командное взаимодействие в постановке." },
        { date: "22.01.2026", text: "Закрыла месяц с лучшими творческими результатами." },
        { date: "14.01.2026", text: "Поддержала запуск нового формата выступлений." },
        { date: "05.01.2026", text: "Закрепила стабильное качество каждого выхода на сцену." },
      ],
    },
  };

  const personKey = (await params).id.trim().toLowerCase();
  const person = halls[personKey];

  if (!person) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "radial-gradient(circle at 50% 10%, #4b140f 0%, #250a08 40%, #140606 100%)",
          color: "#f6d8a2",
          fontFamily: "Georgia, serif",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "36px", marginBottom: "12px" }}>Зал славы не найден</h1>
          <Link href="/?stage=1" style={{ color: "#f3c672" }}>
            Вернуться на сцену
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 50% -15%, #3f1f17 0%, #1e1412 45%, #0d0a09 100%)",
        color: "#f2e4c8",
        fontFamily: "Georgia, serif",
        padding: "30px 20px 56px",
      }}
    >
      <div
        style={{
          maxWidth: "920px",
          margin: "0 auto",
          border: "1px solid rgba(248, 200, 116, 0.35)",
          borderRadius: "18px",
          padding: "24px 24px 28px",
          background: "linear-gradient(180deg, rgba(31,23,20,0.95) 0%, rgba(19,15,13,0.97) 100%)",
          boxShadow: "0 20px 44px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,228,173,0.08)",
        }}
      >
        <Link href="/?stage=1" style={{ color: "#eec274", textDecoration: "none" }}>
          ← Вернуться на сцену
        </Link>

        <h1
          style={{
            margin: "16px 0 6px",
            fontSize: "40px",
            color: "#f8d9a3",
          }}
        >
          {person.name}
        </h1>
        <p style={{ margin: "0 0 22px", color: "#bf9a60", letterSpacing: "0.05em" }}>
          ПЕРСОНАЛЬНЫЙ СПИСОК НАГРАД
        </p>

        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gap: "10px",
          }}
        >
          {person.achievements.map((item, index) => (
            <li
              key={`${item.date}-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns: "130px 1fr",
                gap: "12px",
                alignItems: "center",
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1px solid rgba(243, 196, 111, 0.2)",
                background: "linear-gradient(180deg, rgba(42,32,28,0.72) 0%, rgba(26,21,18,0.84) 100%)",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  color: "#f4cc8f",
                  letterSpacing: "0.02em",
                }}
              >
                {item.date}
              </div>

              <div style={{ lineHeight: 1.4, paddingRight: "8px", color: "#f2e4c8" }}>
                {item.text}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
