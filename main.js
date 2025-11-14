document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const resultsArea = document.getElementById('results');
  const categoryContainer = document.getElementById('categoryButtons');

  const CATEGORY_DEFINITIONS = [
    {
      name: '急行系',
      cards: [
        '229マスカード',
        'リニア周遊カード',
        'はやぶさ周遊カード',
        'のぞみ周遊カード',
        '新幹線周遊カード',
        '特急周遊カード',
        'リニアカード',
        '急行周遊カード',
        'はやぶさカード',
      ],
    },
    {
      name: '移動系',
      cards: [
        '強奪飛び周遊カード',
        '☆飛び周遊カード',
        '物件飛び周遊カード',
        'スペシャルズカード',
        '目的地の近くカード',
        'ヘリポートカード',
        'スペシャルカード',
        '強奪飛びカード',
        '☆飛びカード',
        '物件飛びカード',
        '銀河鉄道カード',
        '千載一遇カード',
        'オール6カード',
        'テレポートカード',
        'ぶっとび周遊カード',
        '里帰りカード',
        'ぴったりカード',
        'ブックマークカード',
        '猪突猛進カード',
      ],
    },
    {
      name: 'お金系',
      cards: [
        '坊主丸儲けカード',
        'ダイヤモンドカード',
        'ベビキュラーカード',
        '虎につばさカード',
        'たいらのまさカード',
        'とっかえっこカード',
        '10億円カード',
        'お殿様カード',
        '親の総取りカード',
        '持ち金ゼロカード',
        'エンジェルカード',
        '連帯保証人カード',
      ],
    },
    {
      name: '物件系',
      cards: [
        'シンデレラカード',
        '強奪飛び周遊カード',
        'プラチナカード',
        'ゴールドカード',
        '物件飛び周遊カード',
        '強奪飛びカード',
        '乗っ取り周遊カード',
        'シルバーカード',
        '物件飛びカード',
        '乗っ取りカード',
      ],
    },
    {
      name: '便利系',
      cards: [
        'ダビングカード',
        'パトカーズ',
        'パトカード',
        '期間延長カード',
        '絶好調カード',
        '君がすべて！カード',
        '福袋カード',
        'シュレッダーカード',
        'あっちいけカード',
        '九死に一生カード',
        'ラッセル車カード',
        '最下位カード',
        'へっちゃらカード',
        '引換券カード',
      ],
    },
    {
      name: '攻撃系',
      cards: [
        '坊主丸儲けカード',
        '刀狩りカード',
        '牛歩カード',
        'キングに！カード',
        '豪速球カード',
        '冬眠カード',
        '強奪飛び周遊カード',
        '親の総取りカード',
        'いただきますカード',
        '強奪飛びカード',
        '乗っ取り周遊カード',
        '最果てカード',
        '周遊禁止カード',
        'サミットカード',
        '場所がえカード',
        'とっかえっこカード',
        'ベビキュラーカード',
        'とびちりカード',
        '乗っ取りカード',
        '孤軍奮闘カード',
        'オナラカード',
        '指定うんち！カード',
        'スリの銀次カード',
        '苦しゅうないカード',
        'ふういんカード',
        '目的地変更カード',
      ],
    },
  ];

  let stationData = [];
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

  const renderResults = (stations) => {
    if (!stations.length) {
      resultsArea.classList.remove('has-result');
      resultsArea.textContent = searchInput.value.trim()
        ? '該当するカードや駅が見つかりません'
        : 'ここに検索結果が表示されます';
      return;
    }

    const fragment = document.createDocumentFragment();

    stations.forEach((station) => {
      const hasPeriodBlocks = Array.isArray(station.periods) && station.periods.length > 0;

      if (hasPeriodBlocks) {
        station.periods.forEach((period) => {
          const periodBlock = document.createElement('div');
          periodBlock.className = getPeriodClassName(period.name, period);

          const header = document.createElement('p');
          header.className = 'period-header';
          header.textContent = `${station.station} (${period.name})`;
          periodBlock.appendChild(header);

          const cardList = document.createElement('ul');
          cardList.className = 'period-card-list';

          period.cards.forEach((card) => {
            const item = document.createElement('li');
            item.textContent = card;
            cardList.appendChild(item);
          });

          periodBlock.appendChild(cardList);
          fragment.appendChild(periodBlock);
        });

        return;
      }

      const fallbackCards = Array.isArray(station.cards) ? station.cards : [];

      if (fallbackCards.length) {
        const fallbackBlock = document.createElement('div');
        fallbackBlock.className = 'period-block period_default';

        const header = document.createElement('p');
        header.className = 'period-header';
        header.textContent = station.station;
        fallbackBlock.appendChild(header);

        const cardList = document.createElement('ul');
        cardList.className = 'period-card-list';

        fallbackCards.forEach((card) => {
          const item = document.createElement('li');
          item.textContent = card;
          cardList.appendChild(item);
        });

        fallbackBlock.appendChild(cardList);
        fragment.appendChild(fallbackBlock);
      }
    });

    resultsArea.innerHTML = '';
    resultsArea.appendChild(fragment);
    resultsArea.classList.add('has-result');
  };

  const filterStations = (query) => {
    if (!query) {
      return [];
    }

    const lowerQuery = normalise(query.trim());

    return stationData
      .map((station) => {
        const stationMatches = normalise(station.station).includes(lowerQuery);
        const periodEntries = station.periods ? Object.entries(station.periods) : [];

        const filteredPeriods = periodEntries.reduce((acc, [periodName, cards]) => {
          const cardList = Array.isArray(cards) ? cards : [];
          const relevantCards = stationMatches
            ? cardList
            : cardList.filter((card) => normalise(card).includes(lowerQuery));

          if (relevantCards.length) {
            acc.push({ name: periodName, cards: relevantCards });
          }

          return acc;
        }, []);

        const fallbackCards = Array.isArray(station.cards) ? station.cards : [];
        const relevantFallback = stationMatches
          ? fallbackCards
          : fallbackCards.filter((card) => normalise(card).includes(lowerQuery));

        if (filteredPeriods.length && relevantFallback.length) {
          filteredPeriods.push({
            name: '期間情報なし',
            cards: relevantFallback,
            isNoPeriod: true,
          });
        }

        if (filteredPeriods.length) {
          return {
            station: station.station,
            periods: sortPeriods(filteredPeriods).map((period) => ({
              ...period,
              cards: period.cards.slice(),
            })),
          };
        }

        if (relevantFallback.length) {
          return {
            station: station.station,
            cards: relevantFallback,
          };
        }

        return null;
      })
      .filter((station) => station !== null);
  };

  const handleSearch = () => {
    const query = searchInput.value.trim();
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
      title.textContent = `[${category.name}]`;
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
      if (station.periods) {
        Object.values(station.periods).forEach((periodCards) => {
          periodCards.forEach((card) => {
            if (card && typeof card === 'string') {
              cards.add(card);
            }
          });
        });
      }

      if (Array.isArray(station.cards)) {
        station.cards.forEach((card) => {
          if (card && typeof card === 'string') {
            cards.add(card);
          }
        });
      }
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
      stationData = Array.isArray(data.stations) ? data.stations : [];
      cardNames = extractCards(stationData);

      createCategoryButtons(cardNames);
    } catch (error) {
      console.error(error);
      resultsArea.textContent = 'データの読み込みに失敗しました。';
    }
  };

  searchInput.addEventListener('input', handleSearch);

  initialise();
});
