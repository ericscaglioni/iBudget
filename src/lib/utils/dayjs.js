import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(localizedFormat);

// Optional: set locale dynamically if needed
// import 'dayjs/locale/pt-br';
// dayjs.locale('pt-br');

export { dayjs };