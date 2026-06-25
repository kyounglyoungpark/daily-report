const 요소 = {
  작성일: document.getElementById("reportDate"),
  메신저: document.getElementById("messengerInput"),
  지라: document.getElementById("jiraInput"),
  샘플불러오기: document.getElementById("loadSampleBtn"),
  로컬생성: document.getElementById("generateBtn"),
  AI생성: document.getElementById("aiGenerateBtn"),
  복사: document.getElementById("copyBtn"),
  다운로드: document.getElementById("downloadBtn"),
  초기화: document.getElementById("resetBtn"),
  상태: document.getElementById("statusMessage"),
  APIKey입력: document.getElementById("apiKeyInput"),
  APIKey저장: document.getElementById("apiKeySaveBtn"),
  APIKey삭제: document.getElementById("apiKeyDeleteBtn"),
  APIKey상태: document.getElementById("apiKeyStatus"),
  보고서모드: document.getElementById("reportModeLabel"),
  보고서제목: document.getElementById("reportTitleLabel"),
  보고서메타: document.getElementById("reportMetaLabel"),
  보고서생성시각: document.getElementById("reportGeneratedAt"),
  요약표바디: document.getElementById("summaryTableBody"),
  보고서본문: document.getElementById("reportBody"),
};

const 샘플파일 = {
  메신저: "./messenger_chat_sample.txt",
  지라: "./jira_task_sample.csv",
};

const 기본메시지 = "샘플 데이터를 불러오거나 직접 입력한 뒤 보고서를 생성할 수 있습니다.";
const 보고서생성방식 = "로컬 샘플 생성";
const API_KEY_저장소 = "securex_api_key";
const MODEL_NAME = "gpt-4o-mini";
const OPENAI_API_URL = "https://api.openai.com/v1/responses";
let 보고서생성됨 = false;

const 오늘 = new Date();
요소.작성일.valueAsDate = 오늘;
초기화출력();
APIKey상태갱신();

요소.샘플불러오기.addEventListener("click", 샘플데이터불러오기);
요소.로컬생성.addEventListener("click", 보고서생성);
요소.AI생성.addEventListener("click", AI보고서생성);
요소.복사.addEventListener("click", 보고서복사);
요소.다운로드.addEventListener("click", TXT다운로드);
요소.초기화.addEventListener("click", 초기화);
요소.APIKey저장.addEventListener("click", APIKey저장);
요소.APIKey삭제.addEventListener("click", APIKey삭제);

function 상태표시(문구) {
  요소.상태.textContent = 문구;
}

function APIKey상태갱신() {
  const 저장된값 = localStorage.getItem(API_KEY_저장소);
  요소.APIKey상태.textContent = 저장된값 ? "API Key 설정됨" : "API Key 미설정";
}

function 보고서모드표시(문구) {
  요소.보고서모드.textContent = 문구;
}

function 초기화출력() {
  요소.보고서제목.textContent = "SecureX 일일 업무보고서";
  요소.보고서메타.textContent = "작성일: -";
  요소.보고서생성시각.textContent = "보고서 생성 시각: -";
  요소.요약표바디.innerHTML = "";
  요소.보고서본문.value = "";
}

async function 샘플데이터불러오기() {
  try {
    상태표시("샘플 파일을 불러오는 중입니다.");
    const [메신저, 지라] = await Promise.all([
      읽기(샘플파일.메신저, "utf-8"),
      읽기(샘플파일.지라, "utf-8"),
    ]);

    요소.메신저.value = 메신저.trim();
    요소.지라.value = 지라.trim();
    상태표시("샘플 데이터 불러오기가 완료되었습니다.");
  } catch (에러) {
    console.error("샘플 데이터를 불러오지 못했습니다.", 에러);
    상태표시("샘플 파일을 읽지 못했습니다. 같은 폴더에서 웹서버로 열어 실행해 주세요.");
  }
}

function APIKey저장() {
  const 값 = 요소.APIKey입력.value.trim();
  if (!값) {
    localStorage.removeItem(API_KEY_저장소);
    요소.APIKey입력.value = "";
    APIKey상태갱신();
    상태표시("API Key가 입력되지 않아 저장하지 않았습니다.");
    return;
  }

  localStorage.setItem(API_KEY_저장소, 값);
  요소.APIKey입력.value = "";
  APIKey상태갱신();
  상태표시("API Key가 저장되었습니다.");
}

function APIKey삭제() {
  localStorage.removeItem(API_KEY_저장소);
  요소.APIKey입력.value = "";
  APIKey상태갱신();
  상태표시("API Key를 삭제했습니다.");
}

async function 읽기(경로, 인코딩) {
  const 응답 = await fetch(경로);
  if (!응답.ok) {
    throw new Error(`파일을 읽지 못했습니다: ${경로}`);
  }

  const 버퍼 = await 응답.arrayBuffer();
  try {
    const 텍스트인코더 = new TextDecoder(인코딩);
    return 텍스트인코더.decode(버퍼);
  } catch {
    const 대체인코더 = new TextDecoder("utf-8");
    return 대체인코더.decode(버퍼);
  }
}

function 보고서생성() {
  const 데이터 = 보고서데이터구성("local");
  if (!데이터) {
    return;
  }
  요소.요약표바디.innerHTML = 데이터.요약표HTML;
  요소.보고서본문.value = 데이터.본문텍스트;
  보고서반영(데이터, "보고서 생성 방식: 로컬 샘플 생성", `${보고서생성방식}으로 보고서를 생성했습니다. OpenAI API Key 없이 실행한 결과입니다.`);
}

async function AI보고서생성() {
  const 저장된APIKey = localStorage.getItem(API_KEY_저장소);
  if (!저장된APIKey) {
    상태표시("API Key가 설정되지 않았습니다. 먼저 API Key를 입력해 주세요.");
    return;
  }

  try {
    상태표시("AI 보고서를 생성 중입니다...");
    const 데이터 = 보고서데이터구성("ai");
    if (!데이터) {
      return;
    }
    const AI본문 = await OpenAI보고서본문생성(저장된APIKey, 데이터);
    요소.요약표바디.innerHTML = 데이터.요약표HTML;
    요소.보고서본문.value = AI본문;
    보고서반영(데이터, "보고서 생성 방식: AI 보고서 생성", "AI 보고서가 생성되었습니다.");
  } catch (에러) {
    console.error("AI 보고서 생성 실패", 에러);
    상태표시(에러?.message || "AI 보고서 생성 중 오류가 발생했습니다.");
  }
}

function 보고서반영(데이터, 모드문구, 상태문구) {
  요소.보고서제목.textContent = 데이터.보고서제목;
  요소.보고서메타.textContent = `작성일: ${데이터.작성일표시}`;
  요소.보고서생성시각.textContent = `보고서 생성 시각: ${데이터.생성시각표시}`;
  보고서모드표시(모드문구);
  상태표시(상태문구);
  보고서생성됨 = true;
}

function 보고서데이터구성(방식) {
  const 작성일문자열 = 요소.작성일.value || 날짜문자열(new Date());
  const 메신저텍스트 = 요소.메신저.value.trim();
  const 지라텍스트 = 요소.지라.value.trim();

  if (!메신저텍스트 || !지라텍스트) {
    상태표시("메신저 대화 내용과 JIRA 업무 데이터를 모두 입력해 주세요.");
    return null;
  }

  const 작성일 = 포맷날짜(작성일문자열);
  const 업무목록 = CSV파싱(지라텍스트);
  const 메신저항목 = 메신저파싱(메신저텍스트);
  const 분석결과 = 업무분석(업무목록, 작성일문자열, 메신저항목);
  const 요약행목록 = 요약표행생성(업무목록, 메신저항목, 작성일문자열);
  const 요약표HTML = 요약표HTML생성(요약행목록);
  const 보고서제목 = `SecureX 일일 업무보고서 (${작성일})`;
  const 생성시각표시 = 한국시간표시(new Date());
  const 본문텍스트 = 방식 === "ai"
    ? ""
    : 로컬본문생성(작성일, 분석결과, 메신저항목, 업무목록);

  return {
    보고서제목,
    작성일표시: 작성일,
    생성시각표시,
    요약표HTML,
    본문텍스트,
    요약행목록,
    분석결과,
    작성일문자열,
    메신저항목,
    업무목록,
  };
}

function 요약표행생성(업무목록, 메신저항목, 작성일문자열) {
  const 메신저요약 = 추출메신저요약(메신저항목);
  const 오늘업무 = [];
  const 다음날 = 다음날문자열(작성일문자열);

  const 완료 = 업무목록.filter((업무) => 정규화상태(업무.status) === "완료").slice(0, 2);
  const 진행중 = 업무목록.filter((업무) => 정규화상태(업무.status).includes("진행")).slice(0, 2);
  const 지연이슈 = 업무목록.filter((업무) => {
    const 상태 = 정규화상태(업무.status);
    return 상태.includes("대기") || 상태.includes("모니터링") || 상태.includes("차단") || 상태.includes("이슈");
  }).slice(0, 2);
  const 내일예정 = 업무목록.filter((업무) => 정규화상태(업무.status).includes("예정") || 업무.due_date === 다음날).slice(0, 2);
  const 지원필요 = 업무목록.filter((업무) => 정규화우선순위(업무.priority) === "high" || 정규화상태(업무.status).includes("대기")).slice(0, 2);

  for (const 업무 of 완료) {
    오늘업무.push(업무를행으로변환(업무, "완료 업무", "완료", 메신저요약, true));
  }

  for (const 업무 of 진행중) {
    오늘업무.push(업무를행으로변환(업무, "진행 중 업무", "진행 중", 메신저요약));
  }

  for (const 업무 of 지연이슈) {
    오늘업무.push(업무를행으로변환(업무, "지연/이슈 업무", 정규화상태(업무.status).includes("모니터링") ? "모니터링" : "대기", 메신저요약));
  }

  for (const 업무 of 내일예정) {
    오늘업무.push(업무를행으로변환(업무, "내일 예정 업무", "예정", 메신저요약));
  }

  for (const 업무 of 지원필요) {
    오늘업무.push(업무를행으로변환(업무, "지원 필요 업무", 업무.due_date === 다음날 ? "예정" : "추가 확인 필요", 메신저요약));
  }

  if (!오늘업무.length) {
    오늘업무.push({
      구분: "추가 확인 필요",
      주요내용: "요약 가능한 주요 업무가 확인되지 않았습니다.",
      담당자: "추가 확인 필요",
      상태: "추가 확인 필요",
      우선순위: "추가 확인 필요",
      다음조치: "추가 확인 필요",
      강조: false,
    });
  }

  return 오늘업무;
}

function 업무를행으로변환(업무, 구분, 상태, 메신저요약, 완료표시 = false) {
  const 우선순위 = 정규화우선순위표시(업무.priority);
  const 주요내용 = 마스킹텍스트(업무.issue_summary || 업무.title);
  const 담당자 = 마스킹텍스트(업무.owner);
  const 다음조치 = 다음조치문구생성(업무, 메신저요약, 완료표시);

  return {
    구분,
    주요내용,
    담당자,
    상태: 상태값정리(상태),
    우선순위,
    다음조치,
    강조: 우선순위 === "High",
  };
}

function 요약표HTML생성(행목록) {
  return 행목록.map((행) => `
    <tr class="${행.강조 ? "우선순위-high" : ""}">
      <td>${HTML이스케이프(행.구분)}</td>
      <td>${HTML이스케이프(행.주요내용)}</td>
      <td>${HTML이스케이프(행.담당자)}</td>
      <td><span class="상태-배지">${HTML이스케이프(행.상태)}</span></td>
      <td><span class="우선순위-배지 ${우선순위클래스(행.우선순위)}">${HTML이스케이프(행.우선순위)}</span></td>
      <td>${HTML이스케이프(행.다음조치)}</td>
    </tr>
  `).join("");
}

function 우선순위클래스(우선순위) {
  if (우선순위 === "High") {
    return "is-high";
  }
  if (우선순위 === "Medium") {
    return "is-medium";
  }
  if (우선순위 === "Low") {
    return "is-low";
  }
  return "is-unknown";
}

function 다음조치문구생성(업무, 메신저요약, 완료표시) {
  if (완료표시) {
    return 마스킹텍스트(업무.next_action || "완료 내역 공유");
  }

  if (업무.next_action) {
    return 마스킹텍스트(업무.next_action);
  }

  if (메신저요약.조치.length) {
    return "메신저 내용 기반 추가 확인 필요";
  }

  return "추가 확인 필요";
}

function 상태값정리(상태) {
  const 값 = 정규화상태(상태);
  if (값.includes("완료")) {
    return "완료";
  }
  if (값.includes("진행")) {
    return "진행 중";
  }
  if (값.includes("모니터링")) {
    return "모니터링";
  }
  if (값.includes("예정")) {
    return "예정";
  }
  if (값.includes("대기") || 값.includes("이슈") || 값.includes("차단")) {
    return "대기";
  }
  return "추가 확인 필요";
}

function 정규화우선순위표시(우선순위) {
  const 값 = 정규화우선순위(우선순위);
  if (값 === "high") return "High";
  if (값 === "medium") return "Medium";
  if (값 === "low") return "Low";
  return "추가 확인 필요";
}

function 로컬본문생성(작성일, 분석결과, 메신저항목, 업무목록) {
  const 완료업무 = 분석결과.완료업무목록.length ? 분석결과.완료업무목록 : 업무목록.filter((업무) => 정규화상태(업무.status) === "완료");
  const 진행업무 = 분석결과.진행업무목록.length ? 분석결과.진행업무목록 : 업무목록.filter((업무) => 정규화상태(업무.status).includes("진행"));
  const 이슈업무 = 분석결과.이슈업무목록.length ? 분석결과.이슈업무목록 : 업무목록.filter((업무) => 정규화상태(업무.status).includes("대기") || 정규화상태(업무.status).includes("모니터링"));
  const 예정업무 = 분석결과.예정업무목록.length ? 분석결과.예정업무목록 : 업무목록.filter((업무) => 정규화상태(업무.status).includes("예정"));
  const 지원필요 = 분석결과.지원필요목록.length ? 분석결과.지원필요목록 : 업무목록.filter((업무) => 정규화우선순위(업무.priority) === "high");
  const 메신저요약 = 추출메신저요약(메신저항목);

  const 줄 = [
    "## 일일 업무 요약",
    `- 작성일 기준 주요 업무를 점검한 결과, 완료 ${완료업무.length}건, 진행 중 ${진행업무.length}건, 지연/이슈 ${이슈업무.length}건, 내일 예정 ${예정업무.length}건으로 정리됩니다.`,
    `- 지원 필요 항목은 ${지원필요.length}건 확인되었으며, 세부 사항은 요약표와 연계해 확인이 필요합니다.`,
    "",
    "## 주요 완료 업무",
    ...완료업무.slice(0, 5).map((업무) => `- [${업무.ticket_id}] ${마스킹텍스트(업무.title)} / 담당: ${마스킹텍스트(업무.owner)} / 다음 조치: ${마스킹텍스트(업무.next_action || "완료 공유")}`),
    "",
    "## 진행 중 업무",
    ...진행업무.slice(0, 5).map((업무) => `- [${업무.ticket_id}] ${마스킹텍스트(업무.title)} / 담당: ${마스킹텍스트(업무.owner)} / 진행률: ${마스킹텍스트(업무.progress)}`),
    "",
    "## 지연/이슈 사항",
    ...이슈업무.slice(0, 5).map((업무) => `- [${업무.ticket_id}] ${마스킹텍스트(업무.title)} / 상태: ${상태값정리(업무.status)} / 확인 필요: ${마스킹텍스트(업무.next_action || 업무.issue_summary || "추가 확인 필요")}`),
    ...메신저요약.이슈.slice(0, 2).map((문장) => `- 메신저 확인: ${문장}`),
    "",
    "## 내일 예정 업무",
    ...예정업무.slice(0, 5).map((업무) => `- [${업무.ticket_id}] ${마스킹텍스트(업무.title)} / 확인 항목: ${마스킹텍스트(업무.next_action || "추가 확인 필요")}`),
    "",
    "## 지원 필요 사항",
    ...지원필요.slice(0, 5).map((업무) => `- [${업무.ticket_id}] ${마스킹텍스트(업무.title)} / 지원 필요 사유: ${마스킹텍스트(업무.next_action || 업무.status)}`),
    ...메신저요약.조치.slice(0, 2).map((문장) => `- 메신저 조치 확인: ${문장}`),
    "",
    "## 내부 공유 메모",
    `- 팀장 공유용으로는 완료 내역과 진행 이슈를 중심으로 우선 정리하는 것이 적절합니다.`,
    `- 고객명, 계정, IP, 내부 URL, API Key는 보고 시 마스킹이 필요합니다.`,
    `- 입력 데이터에 없는 항목은 추가 확인 필요로 표기했습니다.`,
  ];

  return 줄.join("\n");
}

function 업무분석(업무목록, 작성일문자열, 메신저항목) {
  const 메신저요약 = 추출메신저요약(메신저항목);
  const 완료업무목록 = 업무목록.filter((업무) => 정규화상태(업무.status) === "완료");
  const 진행업무목록 = 업무목록.filter((업무) => 정규화상태(업무.status).includes("진행"));
  const 이슈업무목록 = 업무목록.filter((업무) => {
    const 상태 = 정규화상태(업무.status);
    return 상태.includes("대기") || 상태.includes("모니터링") || 상태.includes("차단") || 상태.includes("이슈");
  });
  const 다음날 = 다음날문자열(작성일문자열);
  const 예정업무목록 = 업무목록.filter((업무) => 정규화상태(업무.status).includes("예정") || 업무.due_date === 다음날);
  const 지원필요목록 = 업무목록.filter((업무) => 정규화우선순위(업무.priority) === "high" || 정규화상태(업무.status).includes("대기"));

  const 고우선순위업무목록 = 업무목록.filter((업무) => 정규화우선순위(업무.priority) === "high");
  const 우선순위요약 = 고우선순위업무목록.length
    ? 고우선순위업무목록.slice(0, 3).map((업무) => `[${업무.ticket_id}] ${업무.title}`).join(", ")
    : "추가 확인 필요";

  return {
    완료업무목록,
    진행업무목록,
    이슈업무목록,
    예정업무목록,
    지원필요목록,
    우선순위요약,
    메신저요약,
  };
}

function 추출메신저요약(메신저항목) {
  const 이슈키워드 = ["실패", "오류", "경고", "Offline", "탐지", "차단", "지연", "문제", "재확인", "확인"];
  const 조치키워드 = ["확인", "수정", "재검토", "모니터링", "정리", "요청", "준비", "반영", "진행", "예정"];

  const 이슈 = [];
  const 조치 = [];

  for (const 항목 of 메신저항목) {
    const 문장 = `${항목.time} ${항목.writer}: ${항목.content}`.trim();
    if (이슈키워드.some((키워드) => 문장.includes(키워드))) {
      이슈.push(문장);
    }
    if (조치키워드.some((키워드) => 문장.includes(키워드))) {
      조치.push(문장);
    }
  }

  return {
    이슈: [...new Set(이슈)].slice(0, 5),
    조치: [...new Set(조치)].slice(0, 5),
  };
}

async function OpenAI보고서본문생성(APIKey, 데이터) {
  const 프롬프트 = AI프롬프트구성(데이터);
  const 응답 = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${APIKey}`,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      instructions: "너는 SecureX 기술지원팀의 일일 업무보고서 작성 도우미다. 반드시 한국어로만 답하고, 팀장에게 공유할 수 있는 업무보고서 톤으로 작성해라. 아래 7개 제목은 정확히 유지하고, 모든 제목은 Markdown의 ## 수준으로 작성해라. 사실관계가 입력 데이터에 없으면 추측하지 말고 '추가 확인 필요'라고 써라. 고객명, 계정, IP, 내부 URL, API Key 같은 민감정보는 그대로 노출하지 말고 마스킹 필요라고 써라. 불필요한 서론이나 마무리는 쓰지 마라.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: 프롬프트,
            },
          ],
        },
      ],
      store: false,
    }),
  });

  const 결과 = await 응답.json();
  if (!응답.ok) {
    throw new Error(결과?.error?.message || "OpenAI API 호출에 실패했습니다.");
  }

  const 본문 = 추출응답텍스트(결과).trim();
  if (!본문) {
    throw new Error("AI 응답에서 보고서 본문을 찾지 못했습니다.");
  }

  return 본문;
}

function AI프롬프트구성(데이터) {
  const 요약표텍스트 = 데이터.요약행목록.map((행) => [
    `구분=${행.구분}`,
    `주요내용=${행.주요내용}`,
    `담당자=${행.담당자}`,
    `상태=${행.상태}`,
    `우선순위=${행.우선순위}`,
    `다음조치=${행.다음조치}`,
  ].join(", ")).join("\n");

  const 메신저텍스트 = 데이터.메신저항목
    .map((항목) => `${항목.time} ${항목.writer}: ${마스킹텍스트(항목.content)}`)
    .join("\n");

  const 지라텍스트 = 데이터.업무목록
    .map((업무) => [
      `ticket_id=${마스킹텍스트(업무.ticket_id)}`,
      `title=${마스킹텍스트(업무.title)}`,
      `owner=${마스킹텍스트(업무.owner)}`,
      `status=${마스킹텍스트(업무.status)}`,
      `priority=${마스킹텍스트(업무.priority)}`,
      `due_date=${마스킹텍스트(업무.due_date)}`,
      `customer=${마스킹텍스트(업무.customer)}`,
      `related_system=${마스킹텍스트(업무.related_system)}`,
      `progress=${마스킹텍스트(업무.progress)}`,
      `issue_summary=${마스킹텍스트(업무.issue_summary)}`,
      `next_action=${마스킹텍스트(업무.next_action)}`,
    ].join(", "))
    .join("\n");

  return [
    `보고서 제목: ${데이터.보고서제목}`,
    `작성일: ${데이터.작성일표시}`,
    "",
    "업무 현황 요약표:",
    요약표텍스트,
    "",
    "메신저 대화 내용:",
    메신저텍스트 || "추가 확인 필요",
    "",
    "JIRA 업무 데이터:",
    지라텍스트 || "추가 확인 필요",
    "",
    "다음 형식으로만 본문을 작성해라.",
    "## 일일 업무 요약",
    "## 주요 완료 업무",
    "## 진행 중 업무",
    "## 지연/이슈 사항",
    "## 내일 예정 업무",
    "## 지원 필요 사항",
    "## 내부 공유 메모",
    "",
    "작성 규칙:",
    "- 팀장에게 공유할 수 있는 실무 보고서 톤으로 작성할 것",
    "- 입력 데이터에 없는 내용은 추측하지 말고 '추가 확인 필요'라고 표시할 것",
    "- 고객명, 계정, IP, 내부 URL, API Key는 마스킹 필요로 표시할 것",
    "- 각 섹션에는 핵심 bullet만 간결하게 정리할 것",
  ].join("\n");
}

function 추출응답텍스트(응답데이터) {
  if (typeof 응답데이터.output_text === "string" && 응답데이터.output_text.trim()) {
    return 응답데이터.output_text;
  }

  if (!Array.isArray(응답데이터.output)) {
    return "";
  }

  const 조각 = [];
  for (const 항목 of 응답데이터.output) {
    if (항목.type !== "message" || !Array.isArray(항목.content)) {
      continue;
    }

    for (const 내용 of 항목.content) {
      if (typeof 내용.text === "string") {
        조각.push(내용.text);
      } else if (typeof 내용.content === "string") {
        조각.push(내용.content);
      } else if (typeof 내용.value === "string") {
        조각.push(내용.value);
      }
    }
  }

  return 조각.join("\n");
}

function 마스킹텍스트(문자열) {
  const 값 = (문자열 || "").trim();
  if (!값) {
    return "추가 확인 필요";
  }

  return 값
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, "마스킹 필요")
    .replace(/\bhttps?:\/\/[^\s]+/gi, "마스킹 필요")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "마스킹 필요")
    .replace(/(계정|ID|아이디|이메일|email|user|username)\s*[:=]\s*[^\s,;]+/gi, "$1: 마스킹 필요");
}

function HTML이스케이프(문자열) {
  return String(문자열)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function 정규화상태(문자열) {
  return (문자열 || "").trim().toLowerCase();
}

function 정규화우선순위(문자열) {
  return (문자열 || "").trim().toLowerCase();
}

function 정규화우선순위표시(우선순위) {
  const 값 = 정규화우선순위(우선순위);
  if (값 === "high") return "High";
  if (값 === "medium") return "Medium";
  if (값 === "low") return "Low";
  return "추가 확인 필요";
}

function 상태값정리(상태) {
  const 값 = 정규화상태(상태);
  if (값.includes("완료")) return "완료";
  if (값.includes("진행")) return "진행 중";
  if (값.includes("모니터링")) return "모니터링";
  if (값.includes("예정")) return "예정";
  if (값.includes("대기") || 값.includes("이슈") || 값.includes("차단")) return "대기";
  return "추가 확인 필요";
}

function 다음날문자열(문자열) {
  const 날짜 = new Date(`${문자열}T00:00:00`);
  if (Number.isNaN(날짜.getTime())) {
    return "";
  }

  날짜.setDate(날짜.getDate() + 1);
  return 날짜문자열(날짜);
}

function 날짜문자열(날짜) {
  const 연도 = 날짜.getFullYear();
  const 월 = String(날짜.getMonth() + 1).padStart(2, "0");
  const 일 = String(날짜.getDate()).padStart(2, "0");
  return `${연도}-${월}-${일}`;
}

function 포맷날짜(문자열) {
  const 날짜 = new Date(`${문자열}T00:00:00`);
  if (Number.isNaN(날짜.getTime())) {
    return 문자열;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).format(날짜);
}

function 한국시간표시(날짜) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(날짜);
}

function CSV파싱(텍스트) {
  const 줄목록 = 텍스트.split(/\r?\n/).filter(Boolean);
  if (!줄목록.length) {
    return [];
  }

  const 머리글 = CSV줄파싱(줄목록.shift());
  if (머리글.length) {
    머리글[0] = 머리글[0].replace(/^\uFEFF/, "");
  }

  const 결과 = [];
  for (const 줄 of 줄목록) {
    const 값목록 = CSV줄파싱(줄);
    if (값목록.length < 머리글.length) {
      continue;
    }

    const 항목 = Object.fromEntries(머리글.map((열, 인덱스) => [열.trim(), (값목록[인덱스] || "").trim()]));
    결과.push(항목);
  }

  return 결과;
}

function CSV줄파싱(줄) {
  const 값목록 = [];
  let 현재값 = "";
  let 따옴표안 = false;

  for (let i = 0; i < 줄.length; i += 1) {
    const 글자 = 줄[i];
    const 다음글자 = 줄[i + 1];

    if (글자 === '"' && 따옴표안 && 다음글자 === '"') {
      현재값 += '"';
      i += 1;
      continue;
    }

    if (글자 === '"') {
      따옴표안 = !따옴표안;
      continue;
    }

    if (글자 === "," && !따옴표안) {
      값목록.push(현재값);
      현재값 = "";
      continue;
    }

    현재값 += 글자;
  }

  값목록.push(현재값);
  return 값목록;
}

function 메신저파싱(텍스트) {
  const 줄목록 = 텍스트.split(/\r?\n/);
  const 결과 = [];
  const 패턴 = /^(\d{2}:\d{2})\s+([^\s]+)\s+\(([^)]+)\)\s*(.*)$/;

  for (const 줄 of 줄목록) {
    const 정리된줄 = 줄.trim();
    if (!정리된줄 || 정리된줄.startsWith("=") || 정리된줄.startsWith("[") || 정리된줄.startsWith("#")) {
      continue;
    }

    const 일치 = 정리된줄.match(패턴);
    if (!일치) {
      continue;
    }

    결과.push({
      time: 일치[1],
      writer: `${일치[2]}(${일치[3]})`,
      content: 일치[4].trim(),
    });
  }

  return 결과;
}

function TXT다운로드() {
  const 텍스트 = 내보내기텍스트만들기();
  if (!텍스트) {
    상태표시("다운로드할 보고서가 없습니다. 먼저 보고서를 생성해 주세요.");
    return;
  }

  const 파일명 = 보고서파일명();
  const blob = new Blob([텍스트], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = 파일명;
  a.click();
  URL.revokeObjectURL(url);
  상태표시("TXT 파일 다운로드를 준비했습니다.");
}

function 보고서복사() {
  const 텍스트 = 내보내기텍스트만들기();
  if (!텍스트) {
    상태표시("복사할 보고서가 없습니다. 먼저 보고서를 생성해 주세요.");
    return;
  }

  navigator.clipboard.writeText(텍스트)
    .then(() => 상태표시("보고서가 클립보드에 복사되었습니다."))
    .catch((에러) => {
      console.error("복사 실패", 에러);
      상태표시("클립보드 복사에 실패했습니다. 보고서 내용을 직접 선택해 주세요.");
    });
}

function 내보내기텍스트만들기() {
  if (!보고서생성됨) {
    return "";
  }

  const 제목 = 요소.보고서제목.textContent.trim();
  const 메타 = 요소.보고서메타.textContent.trim();
  const 생성시각 = 요소.보고서생성시각.textContent.trim();
  const 요약표텍스트 = 요약표를텍스트로변환();
  const 본문텍스트 = 요소.보고서본문.value.trim();

  if (!요약표텍스트 && !본문텍스트) {
    return "";
  }

  return [
    제목,
    메타,
    생성시각,
    "",
    "업무 현황 요약표",
    요약표텍스트,
    "",
    "일일 업무보고서 본문",
    본문텍스트,
  ].join("\n");
}

function 요약표를텍스트로변환() {
  const 행들 = [];
  const 헤더 = ["구분", "주요 내용", "담당자", "상태", "우선순위", "다음 조치"];
  행들.push(`| ${헤더.join(" | ")} |`);
  행들.push(`| ${헤더.map(() => "---").join(" | ")} |`);

  const tbody = 요소.요약표바디.querySelectorAll("tr");
  tbody.forEach((행) => {
    const 셀 = 행.querySelectorAll("td");
    if (셀.length) {
      행들.push([
        셀[0].textContent.trim(),
        셀[1].textContent.trim(),
        셀[2].textContent.trim(),
        셀[3].textContent.trim(),
        셀[4].textContent.trim(),
        셀[5].textContent.trim(),
      ].join(" | ").concat(" |"));
    }
  });

  return 행들.join("\n");
}

function 보고서파일명() {
  const 작성일문자열 = 요소.작성일.value || 날짜문자열(new Date());
  return `daily_report_${작성일문자열}.txt`;
}

function 초기화() {
  요소.작성일.value = 날짜문자열(new Date());
  요소.메신저.value = "";
  요소.지라.value = "";
  요소.APIKey입력.value = "";
  APIKey상태갱신();
  보고서모드표시("보고서 생성 방식: 로컬 샘플 생성");
  초기화출력();
  보고서생성됨 = false;
  상태표시(기본메시지);
}

function 보고서기본상태() {
  보고서모드표시("보고서 생성 방식: 로컬 샘플 생성");
  상태표시(기본메시지);
}

보고서기본상태();
