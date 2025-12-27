document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const resultsArea = document.getElementById('results');
  const resultsSection = document.querySelector('.results-section');
  const categoryContainer = document.getElementById('categoryButtons');
  const clearButton = document.getElementById('clearButton');

  const CATEGORY_DEFINITIONS = [
    {
      name: '急行系',
      icon: '✈️',
      cards: [
        'リニア周遊カード',
        'はやぶさ周遊カード',
        'のぞみ周遊カード',
        '新幹線周遊カード',
        '特急周遊カード',
        'リニアカード',
        '急行周遊カード',
        'はやぶさカード',
        'のぞみカード',
        '新幹線カード',
        '特急カード',
      ],
    },
    {
      name: '移動系',
      icon: '🚋',
      cards: [
        '☆飛び周遊カード',
        'スペシャルズカード',
        'ヘリポートカード',
        'スペシャルカード',
        '☆飛びカード',
        'テレポートカード',
        'ぶっとび周遊カード',
        '里帰りカード',
        'ブックマークカード',
        'オール6カード',
        '北へ！カード',
        '西へ！カード',
        'ぶっとびカード',
      ],
    },
    {
      name: 'お金系',
      icon: '💰',
      cards: ['たいらのまさカード', '徳政令カード', '宝くじ駅カード'],
    },
    {
      name: '物件系',
      icon: '🏢',
      cards: [
        '強奪飛び周遊カード',
        '物件飛び周遊カード',
        '強奪飛びカード',
        '乗っ取り周遊カード',
        '物件飛びカード',
        '乗っ取りカード',
      ],
    },
    {
      name: '便利系',
      icon: '🧰',
      cards: [
        'ダビングカード',
        'パトカード',
        '期間延長カード',
        '君がすべて！カード',
        'ラッセル車カード',
        'バキュームカード',
        'お役ごめんカード',
        'カードバンクカード',
      ],
    },
    {
      name: '攻撃系',
      icon: '⚔️',
      cards: [
        'あっちいけカード',
        'イエローカード',
        'うんちカード',
        'うんち突入カード',
        'オナラカード',
        'シュレッダーカード',
        'デビル派遣カード',
        'とびちりカード',
        'ばちあたりカード',
        '牛歩カード',
        '豪速球カード',
        '最果てカード',
        '指定うんち！カード',
        '周遊禁止カード',
        '刀狩りカード',
        'もれちゃうぞカード',
      ],
    },
  ];

  const STATION_PREFECTURES = {
    井原: '岡山県',
    一乗谷: '福井県',
    宇治山田: '三重県',
    宇土: '熊本県',
    王寺: '奈良県',
    加津佐: '長崎県',
    海ほたる: '千葉県',
    葛生: '栃木県',
    宜野湾: '沖縄県',
    恐山: '青森県',
    橋杭岩: '和歌山県',
    熊野本宮: '和歌山県',
    虎姫: '滋賀県',
    五稜郭: '北海道',
    御厨: '大阪府',
    光: '山口県',
    高輪ゲートウェイ: '東京都',
    国府津: '神奈川県',
    佐多: '鹿児島県',
    鷺宮: '東京都',
    三千院: '京都府',
    山鹿: '熊本県',
    宍道: '島根県',
    七類: '島根県',
    若桜: '鳥取県',
    若松: '福島県',
    宗谷: '北海道',
    秋吉台: '山口県',
    女満別: '北海道',
    新札幌: '北海道',
    新青森: '青森県',
    真駒内: '北海道',
    仁淀川: '高知県',
    吹上浜: '鹿児島県',
    寸又峡: '静岡県',
    西大寺: '岡山県',
    西藤原: '三重県',
    西表: '沖縄県',
    赤嶺: '沖縄県',
    千歳: '北海道',
    千里: '大阪府',
    袋田: '茨城県',
    大原: '千葉県',
    大田: '島根県',
    大和八木: '奈良県',
    智頭: '鳥取県',
    中百舌鳥: '大阪府',
    中野: '東京都',
    奈半利: '高知県',
    内灘: '石川県',
    二本松: '福島県',
    波照間: '沖縄県',
    斑鳩: '奈良県',
    苗穂: '北海道',
    福崎: '兵庫県',
    福生: '東京都',
    福部: '鳥取県',
    法隆寺: '奈良県',
    北濃: '岐阜県',
    耶馬渓: '大分県',
    与謝野: '京都府',
  };

  let stationRecords = [];
  let cardNames = [];

  const normalise = (text) => {
    const value = (text ?? '').toString().trim();
    const normalised = typeof value.normalize === 'function' ? value.normalize('NFKC') : value;
    return normalised.toLowerCase();
  };

  const getPeriodSortValue = (periodName) => {
    if (!periodName) {
      return Number.MAX_SAFE_INTEGER;
    }

    const match = periodName.match(/\d+/);
    if (!match) {
      return Number.MAX_SAFE_INTEGER;
    }

    return Number(match[0]);
  };

  const sortPeriods = (periods) =>
    periods
      .slice()
      .sort((a, b) => {
        const aValue = a.isNoPeriod ? Number.MAX_SAFE_INTEGER : getPeriodSortValue(a.name);
        const bValue = b.isNoPeriod ? Number.MAX_SAFE_INTEGER : getPeriodSortValue(b.name);

        if (aValue !== bValue) {
          return aValue - bValue;
        }

        return a.name.localeCompare(b.name, 'ja');
      });

  const getPeriodClassName = (periodName, options = {}) => {
    if (options.isNoPeriod) {
      return 'period-block period_default';
    }

    const value = getPeriodSortValue(periodName);

    if (value <= 49) {
      return 'period-block period_1_49';
    }

    if (value >= 50 && value < 100) {
      return 'period-block period_50';
    }

    if (value >= 100 && value !== Number.MAX_SAFE_INTEGER) {
      return 'period-block period_100';
    }

    return 'period-block period_default';
  };

  const buildStationRecord = (station) => {
    const stationName = (station?.station ?? '').toString().trim();
    const prefecture = STATION_PREFECTURES[stationName] ?? '';
    const displayName = prefecture ? `${stationName}(${prefecture})` : stationName;
    const periodsSource =
      station && station.periods && typeof station.periods === 'object' && !Array.isArray(station.periods)
        ? station.periods
        : {};

    const periodEntries = Object.entries(periodsSource);

    const periodList = periodEntries.map(([periodName, cards]) => {
      const safeCards = Array.isArray(cards) ? cards : [];
      const uniqueCards = Array.from(
        new Set(
          safeCards
            .filter((card) => typeof card === 'string' && card.trim().length > 0)
            .map((card) => card.trim())
        )
      ).sort((a, b) => a.localeCompare(b, 'ja'));

      return {
        name: periodName,
        cards: uniqueCards,
        isNoPeriod: false,
      };
    });

    const fallbackSource = Array.isArray(station?.cards) ? station.cards : [];
    const fallbackCards = Array.from(
      new Set(
        fallbackSource
          .filter((card) => typeof card === 'string' && card.trim().length > 0)
          .map((card) => card.trim())
      )
    ).sort((a, b) => a.localeCompare(b, 'ja'));

    const cardSet = new Set();
    periodList.forEach((period) => {
      period.cards.forEach((card) => {
        cardSet.add(card);
      });
    });
    fallbackCards.forEach((card) => {
      cardSet.add(card);
    });

    const periods = sortPeriods([
      ...periodList.map((period) => ({ ...period })),
      ...(fallbackCards.length
        ? [
            {
              name: '期間情報なし',
              cards: fallbackCards,
              isNoPeriod: true,
            },
          ]
        : []),
    ]);

    const cardList = Array.from(cardSet).sort((a, b) => a.localeCompare(b, 'ja'));

    return {
      station: stationName,
      prefecture,
      displayName,
      periods,
      cardList,
      normalisedStation: normalise(stationName),
      normalisedCards: cardList.map((card) => normalise(card)),
    };
  };

  const resetResults = () => {
    resultsArea.classList.remove('has-result');
    resultsArea.textContent = 'ここに検索結果が表示されます';
    if (resultsSection) {
      resultsSection.classList.add('is-hidden');
    }
  };

  const renderResults = (stations) => {
    if (!stations.length) {
      resultsArea.classList.remove('has-result');
      resultsArea.textContent = searchInput.value.trim()
        ? '該当するカードや駅が見つかりません'
        : 'ここに検索結果が表示されます';
      if (resultsSection && searchInput.value.trim()) {
        resultsSection.classList.remove('is-hidden');
      }
      return;
    }

    const container = document.createElement('div');
    container.className = 'stations-list';

    stations.forEach((station, index) => {
      const stationBlock = document.createElement('div');
      stationBlock.className = 'station-block';

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'station-toggle';
      toggle.setAttribute('aria-expanded', 'false');

      const nameSpan = document.createElement('span');
      nameSpan.textContent = station.displayName || station.station;

      const iconSpan = document.createElement('span');
      iconSpan.className = 'toggle-icon';
      iconSpan.textContent = '+';

      toggle.appendChild(nameSpan);
      toggle.appendChild(iconSpan);

      const content = document.createElement('div');
      content.className = 'station-content';
      const contentId = `station-content-${index}`;
      content.id = contentId;
      content.hidden = true;
      toggle.setAttribute('aria-controls', contentId);

      if (station.periods.length) {
        station.periods.forEach((period) => {
          const periodBlock = document.createElement('div');
          periodBlock.className = getPeriodClassName(period.name, period);

          const header = document.createElement('p');
          header.className = 'period-header';
          header.textContent = period.isNoPeriod ? '期間情報なし' : period.name;
          periodBlock.appendChild(header);

          const cardList = document.createElement('ul');
          cardList.className = 'period-card-list';

          period.cards.forEach((card) => {
            const item = document.createElement('li');
            item.textContent = card;
            cardList.appendChild(item);
          });

          periodBlock.appendChild(cardList);
          content.appendChild(periodBlock);
        });
      } else {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'station-empty';
        emptyMessage.textContent = 'カード情報がありません';
        content.appendChild(emptyMessage);
      }

      toggle.addEventListener('click', () => {
        const isOpen = stationBlock.classList.toggle('open');
        content.hidden = !isOpen;
        toggle.setAttribute('aria-expanded', String(isOpen));
        iconSpan.textContent = isOpen ? '−' : '+';
      });

      stationBlock.appendChild(toggle);
      stationBlock.appendChild(content);
      container.appendChild(stationBlock);
    });

    resultsArea.innerHTML = '';
    resultsArea.appendChild(container);
    resultsArea.classList.add('has-result');
    if (resultsSection) {
      resultsSection.classList.remove('is-hidden');
    }
  };

  const filterStations = (query) => {
    const lowerQuery = normalise(query.trim());

    return stationRecords.filter(
      (station) =>
        station.normalisedStation.includes(lowerQuery) ||
        station.normalisedCards.some((card) => card.includes(lowerQuery))
    );
  };

  const handleSearch = () => {
    const query = searchInput.value.trim();

    if (!query) {
      resetResults();
      return;
    }

    const filtered = filterStations(query);
    renderResults(filtered);
  };

  const createCategoryButtons = (cards) => {
    categoryContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const cardSet = new Set(cards);

    CATEGORY_DEFINITIONS.forEach((category) => {
      const availableCards = category.cards.filter((card) => cardSet.has(card));

      if (!availableCards.length) {
        return;
      }

      const group = document.createElement('div');
      group.className = 'category-group';

      const title = document.createElement('h3');
      title.className = 'category-title';

      if (category.icon) {
        const icon = document.createElement('span');
        icon.className = 'category-icon';
        icon.textContent = category.icon;
        title.appendChild(icon);
      }

      const label = document.createElement('span');
      label.className = 'category-name';
      label.textContent = category.name;
      title.appendChild(label);

      group.appendChild(title);

      const list = document.createElement('div');
      list.className = 'category-card-list';

      availableCards.forEach((card) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'category-card';
        button.textContent = card;

        button.addEventListener('click', () => {
          searchInput.value = card;
          handleSearch();
          searchInput.focus();
        });

        list.appendChild(button);
      });

      group.appendChild(list);
      fragment.appendChild(group);
    });

    categoryContainer.appendChild(fragment);
  };

  const extractCards = (stations) => {
    const cards = new Set();

    stations.forEach((station) => {
      station.cardList.forEach((card) => {
        if (card && typeof card === 'string') {
          cards.add(card);
        }
      });
    });

    return Array.from(cards).sort((a, b) => a.localeCompare(b, 'ja'));
  };

  const initialise = async () => {
    try {
      const response = await fetch('data/card_shops.json');
      if (!response.ok) {
        throw new Error('カード情報の取得に失敗しました');
      }

      const data = await response.json();
      const rawStations = Array.isArray(data.stations) ? data.stations : [];
      stationRecords = rawStations.map((station) => buildStationRecord(station));
      cardNames = extractCards(stationRecords);

      createCategoryButtons(cardNames);
      resetResults();
    } catch (error) {
      console.error(error);
      resultsArea.textContent = 'データの読み込みに失敗しました。';
    }
  };

  searchInput.addEventListener('input', handleSearch);
  searchInput.addEventListener('search', handleSearch);

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      if (searchInput.value) {
        searchInput.value = '';
      }

      resetResults();
      searchInput.focus();
    });
  }

  initialise();
});
