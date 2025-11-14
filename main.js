document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const resultsArea = document.getElementById('results');
  const categoryContainer = document.getElementById('categoryButtons');

  let stationData = [];
  let cardNames = [];

  const normalise = (text) => (text ?? '').toLowerCase();

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

    stations.forEach((station, stationIndex) => {
      const cardWrapper = document.createElement('article');
      cardWrapper.className = 'station-card';

      const hasPeriodBlocks = Array.isArray(station.periods) && station.periods.length > 0;

      if (hasPeriodBlocks) {
        station.periods.forEach((period, periodIndex) => {
          const periodBlock = document.createElement('div');
          periodBlock.className = getPeriodClassName(period.name, period);

          const toggleButton = document.createElement('button');
          toggleButton.type = 'button';
          toggleButton.className = 'period-toggle';
          toggleButton.textContent = `${station.station} (${period.name})`;

          const contentId = `period-${stationIndex}-${periodIndex}`;
          toggleButton.setAttribute('aria-controls', contentId);

          const contentList = document.createElement('ul');
          contentList.className = 'period-content';
          contentList.id = contentId;

          period.cards.forEach((card) => {
            const item = document.createElement('li');
            item.textContent = card;
            contentList.appendChild(item);
          });

          const shouldOpen = periodIndex === 0;
          if (shouldOpen) {
            periodBlock.classList.add('open');
            toggleButton.setAttribute('aria-expanded', 'true');
          } else {
            toggleButton.setAttribute('aria-expanded', 'false');
          }

          toggleButton.addEventListener('click', () => {
            const isOpen = periodBlock.classList.toggle('open');
            toggleButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
          });

          periodBlock.appendChild(toggleButton);
          periodBlock.appendChild(contentList);
          cardWrapper.appendChild(periodBlock);
        });
      }

      const fallbackCards = Array.isArray(station.cards) ? station.cards : [];

      if (!hasPeriodBlocks && fallbackCards.length) {
        const stationTitle = document.createElement('h3');
        stationTitle.className = 'station-name';
        stationTitle.textContent = station.station;
        cardWrapper.appendChild(stationTitle);

        const cardList = document.createElement('ul');
        cardList.className = 'card-list';

        fallbackCards.forEach((card) => {
          const item = document.createElement('li');
          item.textContent = card;
          cardList.appendChild(item);
        });

        cardWrapper.appendChild(cardList);
      }

      if (hasPeriodBlocks || fallbackCards.length) {
        fragment.appendChild(cardWrapper);
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

    cards.forEach((card) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'category-button';
      button.textContent = card;

      button.addEventListener('click', () => {
        searchInput.value = card;
        handleSearch();
        searchInput.focus();
      });

      fragment.appendChild(button);
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
