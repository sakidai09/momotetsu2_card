document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const resultsArea = document.getElementById('results');
  const categoryContainer = document.getElementById('categoryButtons');

  let stationData = [];
  let cardNames = [];

  const normalise = (text) => text.toLowerCase();

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
      const cardWrapper = document.createElement('article');
      cardWrapper.className = 'station-card';

      const stationTitle = document.createElement('h3');
      stationTitle.className = 'station-name';
      stationTitle.textContent = station.station;
      cardWrapper.appendChild(stationTitle);

      const cardList = document.createElement('ul');
      cardList.className = 'card-list';

      station.cards.forEach((card) => {
        const item = document.createElement('li');
        item.textContent = card;
        cardList.appendChild(item);
      });

      cardWrapper.appendChild(cardList);
      fragment.appendChild(cardWrapper);
    });

    resultsArea.innerHTML = '';
    resultsArea.appendChild(fragment);
    resultsArea.classList.add('has-result');
  };

  const filterStations = (query) => {
    if (!query) {
      return [];
    }

    const lowerQuery = normalise(query);

    return stationData
      .map((station) => {
        const matchingCards = station.cards.filter((card) =>
          normalise(card).includes(lowerQuery)
        );

        const stationMatches = normalise(station.station).includes(lowerQuery);

        if (stationMatches) {
          return {
            station: station.station,
            cards: station.cards,
          };
        }

        if (matchingCards.length) {
          return {
            station: station.station,
            cards: matchingCards,
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
      station.cards.forEach((card) => {
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
