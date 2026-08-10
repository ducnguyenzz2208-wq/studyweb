// ============================================================
// FLASHCARD PHONETICS (IPA & PINYIN AUTO-DETECTION ENGINE)
//  - IPA Phonetic Transcription for English (e.g., Water -> /ˈwɔː.tər/, Dog -> /dɒɡ/, Environment -> /ɪnˈvaɪ.rən.mənt/)
//  - Pinyin Transcription for Chinese (e.g., 你好 -> nǐ hǎo, 水 -> shuǐ, 狗 -> gǒu)
//  - Renders compact, elegant phonetic badges in Flashcard Study, Learn, Test, Deck Detail & Edit views
// ============================================================

(function (global) {
  'use strict';

  // ── 1. ENGLISH IPA DICTIONARY & RULE-BASED ENGINE ───────────
  var EN_IPA_DICT = {
    'a': 'eɪ', 'an': 'æn', 'the': 'ðə', 'to': 'tuː', 'in': 'ɪn', 'on': 'ɒn', 'at': 'æt', 'by': 'baɪ',
    'for': 'fɔːr', 'with': 'wɪð', 'about': 'əˈbaʊt', 'against': 'əˈɡenst', 'between': 'bɪˈtwiːn',
    'into': 'ˈɪntuː', 'through': 'θruː', 'during': 'ˈdjʊərɪŋ', 'before': 'bɪˈfɔːr', 'after': 'ˈɑːftər',
    'above': 'əˈbʌv', 'below': 'bɪˈləʊ', 'from': 'frɒm', 'up': 'ʌp', 'down': 'daʊn', 'out': 'aʊt',
    'off': 'ɒf', 'over': 'ˈəʊvər', 'under': 'ˈʌndər', 'again': 'əˈɡen', 'further': 'ˈfɜːðər',
    'then': 'ðen', 'once': 'wʌns', 'here': 'hɪər', 'there': 'ðeər', 'when': 'wen', 'where': 'weər',
    'why': 'waɪ', 'how': 'haʊ', 'all': 'ɔːl', 'any': 'ˈeni', 'both': 'bəʊθ', 'each': 'iːtʃ',
    'few': 'fjuː', 'more': 'mɔːr', 'most': 'məʊst', 'other': 'ˈʌðər', 'some': 'sʌm', 'such': 'sʌtʃ',
    'no': 'nəʊ', 'nor': 'nɔːr', 'not': 'nɒt', 'only': 'ˈəʊnli', 'own': 'əʊn', 'same': 'seɪm',
    'so': 'səʊ', 'than': 'ðæn', 'too': 'tuː', 'very': 'ˈveri', 'can': 'kæn', 'will': 'wɪl',
    'just': 'dʒʌst', 'should': 'ʃʊd', 'now': 'naʊ', 'dog': 'dɒɡ', 'water': 'ˈwɔː.tər',
    'environment': 'ɪnˈvaɪ.rən.mənt', 'cat': 'kæt', 'apple': 'ˈæp.l̩', 'book': 'bʊk',
    'computer': 'kəmˈpjuː.tər', 'language': 'ˈlæŋ.ɡwɪdʒ', 'student': 'ˈstjuː.dənt',
    'teacher': 'ˈtiː.tʃər', 'school': 'skuːl', 'class': 'klɑːs', 'house': 'haʊs',
    'home': 'həʊm', 'family': 'ˈfæm.əl.i', 'friend': 'frend', 'music': 'ˈmjuː.zɪk',
    'hello': 'həˈləʊ', 'world': 'wɜːld', 'life': 'laɪf', 'time': 'taɪm', 'day': 'deɪ',
    'night': 'naɪt', 'year': 'jɪər', 'work': 'wɜːk', 'call': 'kɔːl', 'check': 'tʃek',
    'test': 'test', 'card': 'kɑːd', 'game': 'ɡeɪm', 'answer': 'ˈɑːn.sər', 'question': 'ˈkwes.tʃən',
    'result': 'rɪˈzʌlt', 'score': 'skɔːr', 'learn': 'lɜːn', 'study': 'ˈstʌd.i',
    'good': 'ɡʊd', 'bad': 'bæd', 'big': 'bɪɡ', 'small': 'smɔːl', 'high': 'haɪ', 'low': 'ləʊ',
    'new': 'njuː', 'old': 'əʊld', 'top': 'tɒp', 'back': 'bæk', 'front': 'frʌnt', 'light': 'laɪt',
    'dark': 'dɑːk', 'right': 'raɪt', 'left': 'left', 'man': 'mæn', 'woman': 'ˈwʊm.ən',
    'child': 'tʃaɪld', 'boy': 'bɔɪ', 'girl': 'ɡɜːl', 'person': 'ˈpɜː.sən', 'people': 'ˈpiː.pəl',
    'city': 'ˈsɪt.i', 'country': 'ˈkʌn.tri', 'sun': 'sʌn', 'moon': 'muːn', 'star': 'stɑːr',
    'tree': 'triː', 'flower': 'ˈflaʊ.ər', 'river': 'ˈrɪv.ər', 'mountain': 'ˈmaʊn.tɪn',
    'ocean': 'ˈəʊ.ʃən', 'sea': 'siː', 'bird': 'bɜːd', 'fish': 'fɪʃ', 'food': 'fuːd',
    'bread': 'bred', 'milk': 'mɪlk', 'coffee': 'ˈkɒf.i', 'tea': 'tiː', 'fruit': 'fruːt',
    'color': 'ˈkʌl.ər', 'red': 'red', 'green': 'ɡriːn', 'blue': 'bluː', 'yellow': 'ˈjel.əʊ',
    'black': 'blæk', 'white': 'waɪt', 'one': 'wʌn', 'two': 'tuː', 'three': 'θriː',
    'four': 'fɔːr', 'five': 'faɪv', 'six': 'sɪks', 'seven': 'ˈsev.ən', 'eight': 'eɪt',
    'nine': 'naɪn', 'ten': 'ten', 'hundred': 'ˈhʌn.drəd', 'thousand': 'ˈθaʊ.zənd',
    'happy': 'ˈhæp.i', 'sad': 'sæd', 'love': 'lʌv', 'peace': 'piːs', 'hope': 'həʊp',
    'dream': 'driːm', 'future': 'ˈfjuː.tʃər', 'history': 'ˈhɪs.tər.i', 'science': 'ˈsaɪ.əns',
    'math': 'mæθ', 'physics': 'ˈfɪz.ɪks', 'chemistry': 'ˈkem.ɪ.stri', 'biology': 'ˈbaɪ.ɒl.ə.dʒi',
    'health': 'helθ', 'doctor': 'ˈdɒk.tər', 'hospital': 'ˈhɒs.pɪ.təl', 'car': 'kɑːr',
    'bus': 'bʌs', 'train': 'treɪn', 'plane': 'pleɪn', 'ship': 'ʃɪp', 'phone': 'fəʊn',
    'table': 'ˈteɪ.bəl', 'chair': 'tʃeər', 'door': 'dɔːr', 'window': 'ˈwɪn.dəʊ',
    'space': 'speɪs', 'earth': 'ɜːθ', 'fire': 'ˈfaɪ.ər', 'air': 'eər', 'wind': 'wɪnd'
  };

  // Algorithmic rule fallback for English words not in dictionary
  function ruleBasedIPA(word) {
    var w = word.toLowerCase().trim();
    if (!w) return '';
    if (EN_IPA_DICT[w]) return EN_IPA_DICT[w];

    // Common suffix rules
    if (w.endsWith('ing') && w.length > 4) {
      var base = w.slice(0, -3);
      var baseIpa = EN_IPA_DICT[base] || simpleGraphemeToIPA(base);
      return baseIpa + 'ɪŋ';
    }
    if (w.endsWith('ed') && w.length > 3) {
      var base = w.slice(0, -2);
      var baseIpa = EN_IPA_DICT[base] || simpleGraphemeToIPA(base);
      return baseIpa + 't';
    }
    if (w.endsWith('ly') && w.length > 3) {
      var base = w.slice(0, -2);
      var baseIpa = EN_IPA_DICT[base] || simpleGraphemeToIPA(base);
      return baseIpa + 'li';
    }
    if (w.endsWith('tion') && w.length > 5) {
      var base = w.slice(0, -4);
      var baseIpa = EN_IPA_DICT[base] || simpleGraphemeToIPA(base);
      return baseIpa + 'ʃən';
    }
    if (w.endsWith('s') && w.length > 3) {
      var base = w.slice(0, -1);
      if (EN_IPA_DICT[base]) return EN_IPA_DICT[base] + 'z';
    }

    return simpleGraphemeToIPA(w);
  }

  function simpleGraphemeToIPA(w) {
    var res = w
      .replace(/sh/g, 'ʃ').replace(/ch/g, 'tʃ').replace(/th/g, 'θ')
      .replace(/ph/g, 'f').replace(/ck/g, 'k').replace(/ee/g, 'iː')
      .replace(/ea/g, 'iː').replace(/oo/g, 'uː').replace(/ou/g, 'aʊ')
      .replace(/ow/g, 'əʊ').replace(/ai/g, 'eɪ').replace(/ay/g, 'eɪ')
      .replace(/oi/g, 'ɔɪ').replace(/oy/g, 'ɔɪ').replace(/ar/g, 'ɑː')
      .replace(/or/g, 'ɔː').replace(/er/g, 'ər').replace(/ir/g, 'ɜː')
      .replace(/ur/g, 'ɜː').replace(/qu/g, 'kw').replace(/x/g, 'ks')
      .replace(/c([eiy])/g, 's$1').replace(/c/g, 'k').replace(/q/g, 'k')
      .replace(/y$/g, 'i').replace(/j/g, 'dʒ');
    return res;
  }

  function getEnglishTextIPA(text) {
    if (!text) return '';
    var clean = text.replace(/<[^>]*>/g, ' ').replace(/[.,!?;:"'()\[\]]/g, '').trim();
    if (!clean) return '';
    var words = clean.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    
    // Only generate IPA for short phrases / terms (<= 6 words) suitable for flashcards
    if (words.length > 8) return '';

    var ipaWords = words.map(function (w) {
      var lower = w.toLowerCase();
      return EN_IPA_DICT[lower] || ruleBasedIPA(lower);
    });

    return '/' + ipaWords.join(' ') + '/';
  }

  // ── 2. CHINESE PINYIN CONVERTER ENGINE ───────────────────────
  var ZH_PINYIN_MAP = {
    '你': 'nǐ', '好': 'hǎo', '水': 'shuǐ', '狗': 'gǒu', '猫': 'māo', '人': 'rén',
    '大': 'dà', '小': 'xiǎo', '中': 'zhōng', '国': 'guó', '学': 'xué', '生': 'shēng',
    '老': 'lǎo', '师': 'shī', '家': 'jiā', '天': 'tiān', '地': 'dì', '日': 'rì',
    '月': 'yuè', '年': 'nián', '时': 'shí', '分': 'fēn', '秒': 'miǎo', '一': 'yī',
    '二': 'èr', '三': 'sān', '四': 'sì', '五': 'wǔ', '六': 'liù', '七': 'qī',
    '八': 'bā', '九': 'jiǔ', '十': 'shí', '百': 'bǎi', '千': 'qiān', '万': 'wàn',
    '爱': 'ài', '喜': 'xǐ', '欢': 'huān', '吃': 'chī', '喝': 'hē', '看': 'kàn',
    '听': 'tīng', '说': 'shuō', '读': 'dú', '写': 'xiě', '走': 'zǒu', '跑': 'pǎo',
    '来': 'lái', '去': 'qù', '要': 'yào', '想': 'xiǎng', '能': 'néng', '会': 'huì',
    '是': 'shì', '有': 'yǒu', '在': 'zài', '不': 'bù', '没': 'méi', '也': 'yě',
    '都': 'dōu', '很': 'hěn', '最': 'zuì', '真': 'zhēn', '太': 'tài', '更': 'gèng',
    '多': 'duō', '少': 'shǎo', '长': 'cháng', '短': 'duǎn', '高': 'gāo', '矮': 'ǎi',
    '重': 'zhòng', '轻': 'qīng', '快': 'kuài', '慢': 'màn', '早': 'zǎo', '晚': 'wǎn',
    '前': 'qián', '后': 'hòu', '左': 'zuǒ', '右': 'yòu', '上': 'shàng', '下': 'xià',
    '东': 'dōng', '西': 'xī', '南': 'nán', '北': 'běi', '书': 'shū', '笔': 'bǐ',
    '车': 'chē', '门': 'mén', '花': 'huā', '草': 'cǎo', '木': 'mù', '山': 'shān',
    '河': 'hé', '海': 'hǎi', '风': 'fēng', '雨': 'yǔ', '雪': 'xuě', '火': 'huǒ',
    '心': 'xīn', '手': 'shǒu', '足': 'zú', '头': 'tóu', '目': 'mù', '口': 'kǒu',
    '耳': 'ěr', '鼻': 'bí', '身': 'shēn', '文': 'wén', '字': 'zì', '语': 'yǔ',
    '言': 'yán', '课': 'kè', '室': 'shì', '校': 'xiào', '朋': 'péng', '友': 'yǒu',
    '哥': 'gē', '姐': 'jiě', '弟': 'dì', '妹': 'mèi', '父': 'fù', '母': 'mǔ',
    '爸': 'bà', '妈': 'mā', '子': 'zǐ', '女': 'nǚ', '男': 'nán', '红': 'hóng',
    '黄': 'huáng', '蓝': 'lán', '绿': 'lǜ', '黑': 'hēi', '白': 'bái', '青': 'qīng',
    '金': 'jīn', '银': 'yín', '钱': 'qián', '买': 'mǎi', '卖': 'mài', '货': 'huò',
    '店': 'diàn', '饭': 'fàn', '菜': 'cài', '肉': 'ròu', '鱼': 'yú', '蛋': 'dàn',
    '果': 'guǒ', '茶': 'chá', '酒': 'jiǔ', '香': 'xiāng', '甜': 'tián', '苦': 'kǔ',
    '辣': 'là', '咸': 'xián', '酸': 'suān', '美': 'měi', '丽': 'lì', '好': 'hǎo',
    '坏': 'huài', '对': 'duì', '错': 'cuò', '真': 'zhēn', '假': 'jiǎ', '同': 'tóng',
    '异': 'yì', '新': 'xīn', '旧': 'jiù', '清': 'qīng', '楚': 'chǔ', '明': 'míng',
    '白': 'bái', '暗': 'àn', '难': 'nán', '易': 'yì', '安': 'ān', '全': 'quán',
    '险': 'xiǎn', '静': 'jìng', '闹': 'nào', '冷': 'lěng', '热': 'rè', '暖': 'nuǎn',
    '凉': 'liáng', '春': 'chūn', '夏': 'xià', '秋': 'qiū', '冬': 'dōng', '时': 'shí',
    '间': 'jiān', '空': 'kōng', '位': 'wèi', '置': 'zhì', '方': 'fāng', '向': 'xiàng',
    '形': 'xíng', '状': 'zhuàng', '数': 'shù', '量': 'liàng', '度': 'dù', '量': 'liàng',
    '环': 'huán', '境': 'jìng', '保': 'bǎo', '护': 'hù', '生': 'shēng', '活': 'huó',
    '作': 'zuò', '业': 'yè', '测': 'cè', '验': 'yàn', '考': 'kǎo', '试': 'shì',
    '答': 'dá', '案': 'àn', '问': 'wèn', '题': 'tí', '基': 'jī', '础': 'chǔ',
    '改': 'gǎi', '革': 'gé', '发': 'fā', '展': 'zhǎn', '成': 'chéng', '功': 'gōng',
    '效': 'xiào', '果': 'guǒ', '知': 'zhī', '识': 'shí', '机': 'jī', '器': 'qì',
    '算': 'suàn', '法': 'fǎ', '程': 'chéng', '序': 'xù', '网': 'wǎng', '络': 'luò',
    '字': 'zì', '典': 'diǎn', '谢': 'xiè', '再': 'zài', '见': 'jiàn'
  };

  function getChineseTextPinyin(text) {
    if (!text) return '';
    var clean = text.replace(/<[^>]*>/g, '').trim();
    if (!clean) return '';
    var pinyins = [];
    var count = 0;
    for (var i = 0; i < clean.length; i++) {
      var ch = clean.charAt(i);
      if (/[一-鿿]/.test(ch)) {
        pinyins.push(ZH_PINYIN_MAP[ch] || pinyinFallbackChar(ch));
        count++;
      } else if (/[a-zA-Z0-9]/.test(ch)) {
        pinyins.push(ch);
      }
    }
    if (count === 0) return '';
    return pinyins.join(' ');
  }

  function pinyinFallbackChar(ch) {
    // Simple tone structure fallback indicator if Hanzi character is rare
    var code = ch.charCodeAt(0);
    return ch;
  }

  // ── 3. PUBLIC API: GET PHONETIC TRANSCRIPTION ───────────────
  function fcGetPhonetic(text, lang) {
    if (!text) return null;
    var plain = (typeof _fcPlainText === 'function') ? _fcPlainText(text) : text.replace(/<[^>]*>/g, '').trim();
    if (!plain) return null;

    var resolvedLang = lang;
    if (!resolvedLang || resolvedLang === 'auto') {
      resolvedLang = (typeof fcDetectLang === 'function') ? fcDetectLang(plain) : 'en-US';
    }

    if (resolvedLang.indexOf('en') === 0) {
      var ipa = getEnglishTextIPA(plain);
      return ipa ? { type: 'ipa', lang: resolvedLang, text: ipa } : null;
    }

    if (resolvedLang.indexOf('zh') === 0 || /[一-鿿]/.test(plain)) {
      var pinyin = getChineseTextPinyin(plain);
      return pinyin ? { type: 'pinyin', lang: resolvedLang, text: pinyin } : null;
    }

    return null;
  }

  // ── 4. RENDER PHONETIC BADGE HTML ───────────────────────────
  function fcPhoneticBadgeHtml(text, deckId, card, options) {
    options = options || {};
    var resolvedLang = '';
    if (card && typeof fcLangForCard === 'function') {
      resolvedLang = fcLangForCard(card, deckId, text);
    } else if (typeof fcLangFor === 'function') {
      resolvedLang = fcLangFor(text, deckId);
    } else if (typeof fcDetectLang === 'function') {
      resolvedLang = fcDetectLang(text);
    }

    var phon = fcGetPhonetic(text, resolvedLang);
    if (!phon || !phon.text) return '';

    var badgeClass = phon.type === 'ipa' ? 'fc-phonetic-ipa' : 'fc-phonetic-pinyin';
    var icon = phon.type === 'ipa' ? '🔤 ' : '🈴 ';
    var inlineStyle = options.style ? ' style="' + options.style + '"' : '';

    return '<span class="fc-phonetic-badge ' + badgeClass + '"' + inlineStyle + ' title="' + (phon.type === 'ipa' ? 'Phiên âm IPA (Tiếng Anh)' : 'Phiên âm Pinyin (Tiếng Trung)') + '">' +
      icon + '<span class="fc-phonetic-text">' + escHtml(phon.text) + '</span>' +
      '</span>';
  }

  // Inject default CSS styles for Phonetic Badges if document exists
  if (typeof document !== 'undefined') {
    var styleId = 'fc-phonetics-style';
    if (!document.getElementById(styleId)) {
      var st = document.createElement('style');
      st.id = styleId;
      st.innerHTML =
        '.fc-phonetic-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; font-size: 0.85em; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; font-weight: 500; margin-left: 6px; vertical-align: middle; transition: all 0.2s; }\n' +
        '.fc-phonetic-ipa { background: rgba(79, 70, 229, 0.1); color: #4f46e5; border: 1px solid rgba(79, 70, 229, 0.2); }\n' +
        '.fc-phonetic-pinyin { background: rgba(245, 158, 11, 0.12); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.25); }\n' +
        '.dark .fc-phonetic-ipa { background: rgba(99, 102, 241, 0.2); color: #818cf8; border-color: rgba(99, 102, 241, 0.3); }\n' +
        '.dark .fc-phonetic-pinyin { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border-color: rgba(245, 158, 11, 0.3); }\n' +
        '.fc-phonetic-badge .fc-phonetic-text { letter-spacing: 0.02em; }\n';
      document.head.appendChild(st);
    }
  }

  // Export functions to global scope
  global.fcGetPhonetic = fcGetPhonetic;
  global.fcPhoneticBadgeHtml = fcPhoneticBadgeHtml;

})(typeof window !== 'undefined' ? window : globalThis);
