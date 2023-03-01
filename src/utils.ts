function pad(number: number) {
    return number.toString().padStart(2, '0');
}

export const getFormattedData = (): string => {
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(
        currentDate.getDate(),
    )} ${pad(currentDate.getHours())}:${pad(currentDate.getMinutes())}:${pad(
        currentDate.getSeconds(),
    )}`;
    return formattedDate;
};
