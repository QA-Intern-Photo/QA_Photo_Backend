export function timeAgo(createdAt) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(createdAt)) / 1000);

  const secondsInMinute = 60;
  const secondsInHour = 60 * secondsInMinute;
  const secondsInDay = 24 * secondsInHour;
  const secondsInYear = 365 * secondsInDay;

  if (diffInSeconds < secondsInMinute) {
    return `${diffInSeconds}초 전`;
  } else if (diffInSeconds < secondsInHour) {
    const minutes = Math.floor(diffInSeconds / secondsInMinute);
    return `${minutes}분 전`;
  } else if (diffInSeconds < secondsInDay) {
    const hours = Math.floor(diffInSeconds / secondsInHour);
    return `${hours}시간 전`;
  } else if (diffInSeconds < secondsInYear) {
    const days = Math.floor(diffInSeconds / secondsInDay);
    return `${days}일 전`;
  } else {
    const years = Math.floor(diffInSeconds / secondsInYear);
    return `${years}년 전`;
  }
}
