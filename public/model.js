// Valores exclusivamente didáticos. Não são parâmetros reais da frota Share.
export const AEROPORTOS = [
  {codigo:'SBCY',nome:'Cuiabá',uf:'MT',lat:-15.65,lon:-56.12},
  {codigo:'SBSI',nome:'Sinop',uf:'MT',lat:-11.89,lon:-55.59},
  {codigo:'SBRD',nome:'Rondonópolis',uf:'MT',lat:-16.59,lon:-54.72},
  {codigo:'SBGO',nome:'Goiânia',uf:'GO',lat:-16.63,lon:-49.22},
  {codigo:'SBBR',nome:'Brasília',uf:'DF',lat:-15.87,lon:-47.92},
  {codigo:'SBGR',nome:'São Paulo / Guarulhos',uf:'SP',lat:-23.44,lon:-46.47},
];
export const PREMISSAS = Object.freeze({velocidadeKmh:400,litrosHora:240,combustivelLitro:8.5,fixoAnual:720000,reservaHora:900,taxaTrecho:350,hotelPessoa:400,diariaPessoa:180,hangarNoite:500,tripulantes:2,taxiHora:11500});
export function distanciaKm(origem,destino){
  const a=AEROPORTOS.find(x=>x.codigo===origem),b=AEROPORTOS.find(x=>x.codigo===destino);
  if(!a||!b||a===b) throw new Error('Escolha aeroportos de origem e destino diferentes.');
  const rad=x=>x*Math.PI/180, dlat=rad(b.lat-a.lat), dlon=rad(b.lon-a.lon);
  const h=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlon/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
}
export function simular({origem='SBCY',destino='SBSI',horasAno=120,cotas=3,dias=1,passageiros=4,idaVolta=true}={}){
  horasAno=Number(horasAno);cotas=Number(cotas);dias=Number(dias);passageiros=Number(passageiros);
  if(!Number.isFinite(horasAno)||horasAno<20||horasAno>400) throw new Error('Informe de 20 a 400 horas anuais por cotista.');
  if(!Number.isInteger(cotas)||cotas<1||cotas>4) throw new Error('Escolha entre 1 e 4 cotas.');
  if(!Number.isInteger(dias)||dias<1||dias>7) throw new Error('Informe entre 1 e 7 dias de jornada.');
  if(!Number.isInteger(passageiros)||passageiros<1||passageiros>6) throw new Error('Informe de 1 a 6 passageiros.');
  const p=PREMISSAS,trechos=idaVolta?2:1,km=distanciaKm(origem,destino)*trechos;
  const horas=(km/p.velocidadeKmh)+0.15*trechos; // 9 minutos operacionais por trecho
  const noites=dias-1,combustivel=horas*p.litrosHora*p.combustivelLitro;
  const hotel=noites*p.tripulantes*p.hotelPessoa,diarias=dias*p.tripulantes*p.diariaPessoa,taxas=trechos*p.taxaTrecho,hangar=noites*p.hangarNoite;
  const cent=v=>Math.round(v*100);
  const curtoCent=cent(combustivel+hotel+diarias+taxas+hangar);
  const medioCent=cent(p.fixoAnual/cotas/horasAno*horas),longoCent=cent(p.reservaHora*horas);
  const curto=curtoCent/100,medio=medioCent/100,longo=longoCent/100;
  const total=(curtoCent+medioCent+longoCent)/100;
  const privada=(curtoCent+cent(p.fixoAnual/horasAno*horas)+longoCent)/100;
  // Mesma rota/tempo para todos. Cotação de táxi aéreo inteiramente hipotética.
  const taxi=horas*p.taxiHora+hotel+diarias+taxas+hangar;
  return {km,horas,trechos,noites,combustivel,hotel,diarias,taxas,hangar,curto,medio,longo,total,privada,taxi,custoHora:total/horas,porAssento:total/passageiros,fixoMes:p.fixoAnual/cotas/12,origem,destino,horasAno,cotas,dias,passageiros,idaVolta};
}
export function ratearCentavos(total,pesos){
  if(!Number.isSafeInteger(total)||total<0||!pesos.length||pesos.some(x=>!Number.isFinite(x)||x<0)||pesos.reduce((a,b)=>a+b,0)<=0) throw new Error('Rateio inválido.');
  const soma=pesos.reduce((a,b)=>a+b,0),brutos=pesos.map(p=>total*p/soma),partes=brutos.map(Math.floor);
  let resto=total-partes.reduce((a,b)=>a+b,0);
  const ordem=brutos.map((v,i)=>({i,resto:v-partes[i]})).sort((a,b)=>b.resto-a.resto||a.i-b.i);
  for(let i=0;i<resto;i++) partes[ordem[i%ordem.length].i]++;
  return partes;
}
export const COTISTAS=['Cliente da Share','Cotista B','Cotista C'];
export const MESES=['Junho','Julho','Agosto','Setembro','Outubro','Novembro'];
const FATORES=[.86,.93,1.04,.96,1.12,1];
export function financeiro(mes=5){
  if(!Number.isInteger(mes)||mes<0||mes>5) throw new Error('Mês inválido.');
  const f=FATORES[mes],horas=[12,10.5,7.5].map(x=>x*f),pesos=horas;
  const base=[
    ['Combustível','COMBUSTÍVEIS',2600000,'VARIÁVEL',0,'Abastecimento demonstrativo'],
    ['Tripulação','TRIPULAÇÃO',2400000,'FIXO',1,'Folha demonstrativa'],
    ['Hangar na base','ESTRUTURA',1200000,'FIXO',2,'Hangar demonstrativo'],
    ['Seguro aeronáutico','ESTRUTURA',800000,'FIXO',0,'Seguradora demonstrativa'],
    ['Manutenção preventiva','MANUTENÇÃO',1500000,'FIXO',1,'Oficina demonstrativa'],
    ['Despesas de viagem','VIAGEM',900000,'VARIÁVEL',2,'Prestadores demonstrativos'],
    ['Reserva de manutenção','RESERVA',1000000,'VARIÁVEL',0,'Fundo demonstrativo'],
  ];
  const lancamentos=base.map(([descricao,categoria,valor,regra,pagoPor,fornecedor],i)=>{
    const valorCentavos=Math.round(valor*(regra==='FIXO'?1:f));
    return {id:`DEMO-${mes+6}-${i+1}`,descricao,categoria,valorCentavos,regra,pagoPor,fornecedor,dia:3+i*3,partes:ratearCentavos(valorCentavos,regra==='FIXO'?[1,1,1]:pesos)};
  });
  const total=lancamentos.reduce((s,l)=>s+l.valorCentavos,0),totalHoras=horas.reduce((a,b)=>a+b,0);
  const saldos=COTISTAS.map((nome,i)=>{const devido=lancamentos.reduce((s,l)=>s+l.partes[i],0),pago=lancamentos.reduce((s,l)=>s+(l.pagoPor===i?l.valorCentavos:0),0);return {nome,devido,pago,saldo:pago-devido,horas:horas[i]};});
  return {mes,ano:2026,lancamentos,total,horas:totalHoras,saldos,custoHora:total/100/totalHoras};
}
export function formatarHoras(h){const min=Math.round(h*60);return `${Math.floor(min/60)}h ${String(min%60).padStart(2,'0')}min`;}
export function isoLocal(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function parseData(iso){return new Date(`${iso}T12:00:00`);}
export function hojeISO(){return isoLocal(new Date());}
export function deslocarData(iso,dias){const d=parseData(iso);d.setDate(d.getDate()+dias);return isoLocal(d);}
export function dataBloqueada(iso,reservas=[],ignorarId=null){
  const d=parseData(iso);return [7,14,21,28].includes(d.getDate())||reservas.some(v=>v.id!==ignorarId&&v.data===iso&&v.status!=='CANCELADO');
}
export function validarReserva(v,reservas=[],hoje=hojeISO()){
  if(!AEROPORTOS.some(x=>x.codigo===v.origem)||!AEROPORTOS.some(x=>x.codigo===v.destino)||v.origem===v.destino) return 'Escolha origem e destino diferentes.';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(v.data)||Number.isNaN(parseData(v.data).getTime())||isoLocal(parseData(v.data))!==v.data) return 'Escolha uma data válida.';
  if(v.data<=hoje) return 'Escolha uma data a partir de amanhã.';
  const limite=parseData(hoje);limite.setMonth(limite.getMonth()+6);if(v.data>isoLocal(limite)) return 'A agenda demonstrativa permite reservas para os próximos seis meses.';
  if(dataBloqueada(v.data,reservas)) return 'Esta data está indisponível. Escolha outro dia no calendário.';
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(v.horario)) return 'Informe um horário válido.';
  if(!Number.isInteger(Number(v.passageiros))||Number(v.passageiros)<1||Number(v.passageiros)>6) return 'A aeronave demonstrativa acomoda de 1 a 6 passageiros.';
  if(reservas.filter(v=>v.status!=='CANCELADO').length>=12) return 'A demo permite até 12 reservas. Cancele uma reserva ou reinicie a experiência.';
  return '';
}
export function reservasIniciais(hoje=hojeISO()){
  let data=deslocarData(hoje,4);while(dataBloqueada(data))data=deslocarData(data,1);
  return [{id:'DEMO-001',origem:'SBCY',destino:'SBSI',data,horario:'09:00',passageiros:4,emprestado:false,status:'CONFIRMADO'}];
}
// Persistência isolada e validada: nunca contém tokens ou dados do portal real.
export const STORAGE_KEY='share-conheca-demo-v1';
export function lerReservas(storage,hoje=hojeISO()){
  try{
    const raw=storage.getItem(STORAGE_KEY);if(!raw)return reservasIniciais(hoje);
    const value=JSON.parse(raw);
    if(!Array.isArray(value)||value.length>30) return reservasIniciais(hoje);
    const ids=new Set();
    const validas=value.filter(v=>v&&typeof v==='object'&&/^DEMO-[a-zA-Z0-9-]{1,60}$/.test(v.id)&&!ids.has(v.id)&&!!ids.add(v.id)&&AEROPORTOS.some(a=>a.codigo===v.origem)&&AEROPORTOS.some(a=>a.codigo===v.destino)&&v.origem!==v.destino&&/^\d{4}-\d{2}-\d{2}$/.test(v.data)&&Number.isFinite(parseData(v.data).getTime())&&isoLocal(parseData(v.data))===v.data&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v.horario)&&Number.isInteger(v.passageiros)&&v.passageiros>=1&&v.passageiros<=6&&['SOLICITADO','CONFIRMADO','CANCELADO'].includes(v.status)&&typeof v.emprestado==='boolean');
    return validas.length?validas:reservasIniciais(hoje);
  }catch{return reservasIniciais(hoje);}
}
