export const getCardCount = (cardCountData) => {
  const cardCount = {
    totalCount: 0,
    commonCount: 0,
    rareCount: 0,
    superRareCount: 0,
    legendaryCount: 0
  };

  cardCountData.map((v) => {
    if (v.grade === "COMMON") cardCount.commonCount = v._count.grade;
    if (v.grade === "RARE") cardCount.rareCount = v._count.grade;
    if (v.grade === "SUPER_RARE") cardCount.superRareCount = v._count.grade;
    if (v.grade === "LEGENDARY") cardCount.legendaryCount = v._count.grade;
    cardCount.totalCount += v._count.grade;
  });

  return cardCount;
};
