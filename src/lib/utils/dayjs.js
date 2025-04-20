import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";

// Enable plugin
dayjs.extend(localizedFormat);

// Optional: set locale dynamically if needed
// import 'dayjs/locale/pt-br';
// dayjs.locale('pt-br');

export default dayjs;