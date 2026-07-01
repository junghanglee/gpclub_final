export const ZALO_PHONE = "84906840149";
export const WHATSAPP_PHONE = "84906840149";

export const COMPANY = {
  legalName: "GPCLUB VIETNAM CO., LTD",
  legalNameVi: "CÔNG TY TNHH GPCLUB VIỆT NAM",
  taxCode: "0317324490",
  representative: "Kim Kyuwoong",
  established: "2022-06-03",
  address: "27-29 Nguyen Cuu Van, Gia Dinh Ward, Ho Chi Minh City, Vietnam",
  addressShort: "27-29 Nguyen Cuu Van, Gia Dinh Ward, HCMC",
  phone: "+84 90 684 0149",
  phoneTel: "+84906840149",
  email: "hello@gpclub.vn",
  mapsQuery: "27-29 Nguyen Cuu Van, Gia Dinh Ward, Ho Chi Minh City",
} as const;

export const zaloLink = (msg = "Hello GPCLUB Vietnam!") =>
  `https://zalo.me/${ZALO_PHONE}?msg=${encodeURIComponent(msg)}`;

export const whatsappLink = (msg = "Hello GPCLUB Vietnam!") =>
  `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
