
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

function currentDate(format) {
  const time = Date.now();
  const now = new Date(time);
  var datestr = '';
  if (format === 'full') {
    datestr =
      now.getFullYear() + '-' +
      ('0' + (now.getMonth()+1)).slice(-2) + '-' +
      ('0' + now.getDate()).slice(-2) + ' '
  }
  datestr +=
      now.getHours() + ':' +
      ('0' + now.getMinutes()).slice(-2) + ':' +
      ('0' + now.getSeconds()).slice(-2) + ' - ' +
      ('00' + now.getMilliseconds()).slice(-3)
  return datestr
}

module.exports = { sleep,
                   currentDate }
