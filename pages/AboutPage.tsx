import React from 'react';
import SEO from '../components/SEO';

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto font-serif text-ink-800 animate-in fade-in duration-500 text-lg leading-loose">
      <SEO title="關於我" description="關於社會觀測站與作者的簡介" />
      <h1 className="font-serif font-bold text-3xl mb-10 text-ink-900">關於這裡</h1>
      
      <p className="mb-6">
        你好，歡迎來到「社會觀測站」。
      </p>

      <p className="mb-6">
        這裡是一個嘗試用社會科學的視角，去理解日常生活的角落。我一直著迷於經典理論與現代生活的交會處：涂爾幹會怎麼解釋社群焦慮？馬克思會如何看待零工經濟？高夫曼會怎麼分析我們的 Instagram 限時動態？
      </p>

      <p className="mb-6">
        社會學聽起來很嚴肅，但它其實是關於「連結」的學問。它幫助我們看見那些隱形卻強大的結構，如何影響了我們的愛、工作與孤獨。
      </p>

      <h3 className="font-bold text-2xl mt-12 mb-6 text-ink-900">為什麼是「科普與隨筆」？</h3>
      <p className="mb-6">
        知識不該只留在學院的高牆內。我希望用更輕鬆、更像散文的方式，把這些概念帶入生活中。有時候是嚴謹的理論介紹，有時候只是雨天的喃喃自語。
      </p>
      
      <p className="mb-6">
        網站的設計刻意保持米白色的溫暖基調，去除了過多的干擾。在這個資訊過載的時代，希望這裡能提供你一段安靜閱讀的時光。
      </p>

      <h3 className="font-bold text-2xl mt-12 mb-6 text-ink-900">聯絡</h3>
      <p className="mb-6">
        我很少使用社群軟體，但歡迎透過電子郵件與我交流想法：<span className="text-ink-900 font-semibold border-b border-ink-300">hello@sociologysolitude.com</span>。
      </p>
    </div>
  );
};

export default AboutPage;