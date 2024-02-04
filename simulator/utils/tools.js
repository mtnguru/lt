
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

function convertDate(time, format) {
  const now = new Date(time);
  var datestr = '';
  if (format === 'full') {
    datestr =
      now.getFullYear() + '-' +
      ('0' + (now.getMonth()+1)).slice(-2) + '-' +
      ('0' + now.getDate()).slice(-2) + ' ' +
      now.getHours() + ':' +
      ('0' + now.getMinutes()).slice(-2) + ':' +
      ('0' + now.getSeconds()).slice(-2) + '.' +
      ('00' + now.getMilliseconds()).slice(-3)
  } else if (format === 'short') {
    datestr =
      now.getHours() + ':' +
      ('0' + now.getMinutes()).slice(-2) + ':' +
      ('0' + now.getSeconds()).slice(-2)
  } else {
    datestr =
      now.getHours() + ':' +
      ('0' + now.getMinutes()).slice(-2) + ':' +
      ('0' + now.getSeconds()).slice(-2) + ' - ' +
      ('00' + now.getMilliseconds()).slice(-3)
  }
  return datestr
}

const currentDate = (format) => {
  return convertDate(Date.now(),format)
}

module.exports = { sleep,
                   convertDate,
                   currentDate }