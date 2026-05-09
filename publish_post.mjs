// 執行方式：node publish_post.mjs
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// 讀取 .env.local
const __dir = dirname(fileURLToPath(import.meta.url))
const envFile = readFileSync(join(__dir, '.env.local'), 'utf-8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const [k, ...v] = l.split('=')
      return [k.trim(), v.join('=').trim().replace(/^["']|["']$/g, '')]
    })
)

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()

const post = {
  slug: 'social-inequality-and-stratification',
  title: '階層的重量：從學術研究看社會不平等如何世代相傳',
  excerpt: '你的出生地決定了你的命運嗎？研究臺灣代間流動的經濟學家發現，父母的社經地位對子女的影響程度，比我們以為的更深、更持久。本文梳理社會階層化的核心理論，並援引近年實證研究，解析不平等如何在看不見的地方悄悄複製自己。',
  date: '2026-05-09',
  readTime: '15 分鐘',
  coverImage: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=1400',
  tags: ['社會階層', '社會不平等', '代間流動', '布迪厄', '文化資本', '臺灣社會'],
  initialLikes: 0,
  content: `## 一個令人不安的數字

2021 年，經濟學家 Hsu 在《Journal of Economic Inequality》發表了一項針對臺灣的研究。他用比傳統方法更精確的「潛在社經地位」模型，重新估算父母地位對子女的影響程度——結果得出的代間彈性係數（IGE）落在 **0.4 至 0.5 之間**，比過去估計值高出許多，與美國相當，遠高於北歐國家的 0.1 至 0.2。

換句話說：在臺灣，你父母站在哪個位置，有將近一半的力量會決定你將來站在哪裡。

這個數字不是在說個人努力沒有意義。它說的是：**努力在一個什麼樣的結構裡運作**，才是決定結果的關鍵變數。

---

## 什麼是社會階層化？

**社會階層化（Social Stratification）**指的是社會資源——財富、教育、聲望、權力——的不平等分配，以及這種分配所形成的穩定層級結構。

它的核心特徵不只是「差距的存在」，而是這種差距具有：

**系統性**：不平等不是隨機的，而是依循可辨識的社會規則分布。
**再生產性**：每個世代的不平等，傾向複製前一個世代的結構，而非隨機重組。

後者——再生產性——是社會學最核心也最令人不安的發現。理解它需要三位思想家提供的框架。

---

## 三個理論座標

### 馬克思：生產關係的根本裂縫

卡爾・馬克思（Karl Marx）從**生產資料的所有權**出發，將資本主義社會劃分為兩個根本對立的階級：擁有工廠、土地、資本的**資產階級（Bourgeoisie）**，以及只能出售自身勞動力的**無產階級（Proletariat）**。

馬克思的洞見不只是指出「有錢人和窮人」的差別，而是揭示這種差別背後的**權力不對等**：誰有工作、做什麼工作、獲得多少報酬，都由資本方決定。他認為，這種結構性的剝削關係必然產生階級衝突。

馬克思的革命預言雖未成真，但他對「經濟基礎決定社會關係」的分析，至今仍是不平等研究的重要起點。

### 韋伯：多維度的不平等地圖

馬克斯・韋伯（Max Weber）接受馬克思的許多前提，但認為將不平等化約為單一經濟軸線過於簡化。他提出三個相互交織、卻又可以分離的不平等維度：

**財富（Class）**：市場中的經濟地位——收入、財產、投資能力。
**聲望（Status）**：社會給予特定群體的榮譽與尊重——一個落魄的老牌世家，社會地位可能仍高於新富商人。
**權力（Party）**：在政治與組織場域中動員資源、影響決策的能力。

韋伯的框架幫助我們理解現實的複雜性：為什麼有人「有錢沒地位」，有人「沒錢卻有話語權」。社會位置是多個座標共同決定的結果，不能單看其中一個。

### 布迪厄：隱形資本的運作機制

皮耶・布迪厄（Pierre Bourdieu）是二十世紀解釋不平等「如何自我複製」最有力的社會學家。他的核心貢獻，在於揭示那些**不以金錢形式流通的資本**。

布迪厄將資本分為三種形式：

| 資本類型 | 定義 | 典型例子 |
|----------|------|----------|
| **經濟資本** | 財富與物質資源 | 存款、不動產、股票 |
| **文化資本** | 知識、技能、文化品味與學歷 | 語言能力、藝術鑑賞、高學歷文憑 |
| **社會資本** | 人際關係網絡及其帶來的資源 | 校友圈、家族人脈、業界社群 |

這三種資本的關鍵特性是：**它們可以相互轉換，也可以跨代傳承**。富裕家庭傳遞給子女的，不只是金錢，還有說話的方式、審美的品味、與權威人士互動的從容——布迪厄將這種深層的身體化傾向稱為「**慣習（Habitus）**」。

---

## 文化資本，有因果效果嗎？

布迪厄的理論影響深遠，但長期面臨一個實證挑戰：相關性不等於因果性。也許只是「有錢的家庭同時提供了金錢和文化刺激」，而真正起作用的只有錢？

2018 年，社會學家 Jæger 與 Karlson 在《Sociological Science》發表了一篇方法論上的突破性研究。他們使用反事實分析框架，在控制家庭社經背景後，獨立估計文化資本對教育成就的影響。結果顯示：**文化資本對教育不平等確實具有獨立的因果效果**，而非只是收入差距的附帶現象。

這意味著：即便兩個家庭收入相同，那個讓孩子從小接觸博物館、古典音樂、閱讀習慣的家庭，孩子在學業上仍可能佔有優勢——因為學校系統本身就是用中上階層的文化標準來評估學生的。

---

## 臺灣的代間流動：數據說什麼？

回到臺灣的情況。Hsu（2021）的研究之所以重要，在於他修正了過去因「測量誤差衰減偏誤（attenuation bias）」而低估的流動性——過去認為臺灣流動性頗高，但更精確的估計顯示，**實際的代間持續性遠比表面數字更強**。

Chu 與 Lin（2020）在《Empirical Economics》中追蹤 1990 至 2010 年臺灣的代間所得流動，同樣發現流動性並未如想像中樂觀，且有地區性的顯著差異——城鄉之間的機會差距，是影響流動的重要結構因素。

這些發現與美國的研究形成對話。Chetty 等人（2014）在分析數百萬美國家庭後發現，**出生的郵遞區號**是預測一個孩子未來收入的重要變數：學校品質、社區環境、同儕組成，都系統性地影響著向上流動的機率。

臺灣的情況類似。你在哪個行政區就學，不只影響你接觸的老師資源，更影響你認識哪些人、暴露在哪些信息環境裡——而這些差距，會在往後數十年中持續累積。

---

## 不平等為何能持續再生產？

如果人們都感受到不平等的壓力，為什麼這個系統還能穩定運作、世代複製？社會學提供了幾個層次的解釋。

**意識形態的正當化**：「努力就會成功」的論述，讓人們傾向將階層差距歸因於個人能力與意志，而非結構因素。這種歸因方式——社會學稱為「功績主義迷思（Meritocracy Myth）」——不只讓優勢者合理化自己的位置，也讓弱勢者將困境內化為個人失敗，而非系統性問題。

**社會資本的封閉性**：優質的機會往往在封閉的網絡中流通。內部推薦、非正式招募、人脈介紹——這些管道對圈外人幾乎不可見，卻決定了許多重要機會的分配。

**文化資本的早期投入**：慣習從童年開始塑造，且一旦形成便相對穩定。教育系統雖然表面上對所有人開放，但其評估標準——語言風格、發言方式、對抽象思考的熟悉度——往往更有利於已具備相關文化資本的孩子。

**制度性篩選的累積效應**：從入學考試到就業面試，每個篩選機制都不是中性的。即便沒有明顯的歧視意圖，這些篩選機制仍會在長時間內系統性地放大起點的差距。

---

## 改變的可能性與條件

社會學揭示結構，並非要宣告個人的無能為力。歷史上確實存在社會流動性顯著提升的時期，而這些轉變都有可辨識的政策條件：

**教育投資的質與量**：提供高品質公共教育、補足城鄉資源差距，是縮小起點差距最直接的手段。Chetty 等人的研究也顯示，學校品質是影響流動性最重要的地方性因素之一。

**社會安全網的厚度**：能讓人在失敗後重新站起來的制度，可以降低風險厭惡、鼓勵跨階層的嘗試與流動。

**財富集中的制度性制衡**：當財富高度集中，經濟資本轉化為政治影響力的能力也隨之增強，進一步鞏固既有的階層結構。累進稅制與財富重分配機制，是阻斷這個迴路的工具之一。

**多元評價標準的建立**：若社會僅以單一指標（如學歷、財富）衡量「成功」，則其他形式的資本與貢獻將被系統性低估，不平等的感受也會更加劇烈。

---

## 結語：數字背後的人

0.4 至 0.5。

這不只是一個統計係數。它意味著：每一個相信「只要努力就能突破」的孩子，都在與一個傾向於複製現狀的系統博鬥。他們的努力是真實的，他們的才華是真實的，但他們面對的阻力——隱形的、系統性的——也是真實的。

認識這些阻力，不是為了製造無力感，而是為了讓我們對「成功」與「失敗」的解釋更加誠實；也讓我們在設計制度、評估政策時，能問出更準確的問題：這個安排，讓電梯對所有人都開著嗎？

---

## 參考文獻

- Hsu, M. (2021). Intergenerational persistence in latent socioeconomic status: evidence from Taiwan. *Journal of Economic Inequality*, 19, 667–690.
- Jæger, M. M., & Karlson, K. B. (2018). Cultural capital and educational inequality: A counterfactual analysis. *Sociological Science*, 5, 780–816.
- Chu, C., & Lin, T. (2020). Intergenerational earnings mobility in Taiwan: 1990–2010. *Empirical Economics*, 59, 1315–1338.
- Chetty, R., Hendren, N., Kline, P., & Saez, E. (2014). Where is the land of opportunity? The geography of intergenerational mobility in the United States. *Quarterly Journal of Economics*, 129(4), 1553–1623.
- Bourdieu, P. (1984). *Distinction: A Social Critique of the Judgement of Taste*. Harvard University Press.
`,
}

async function main() {
  console.log('🚀 連接 Firebase...')
  await db.collection('posts').doc(post.slug).set(post)
  console.log(`✅ 文章發布成功！`)
  console.log(`   標題：${post.title}`)
  console.log(`   網址：/post/${post.slug}`)
  process.exit(0)
}

main().catch(err => {
  console.error('❌ 發布失敗：', err.message)
  process.exit(1)
})
