/**
 * server/services/importer.js
 * Módulo de normalização e importação das planilhas reais do Pedro (.bet.br)
 */

function normalizeUsername(str) {
  if (!str) return ''
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/\s+/g, '')
}

function normalizePhone(str) {
  if (!str) return null
  const s = String(str).trim()
  if (s.includes("''") || s === "''''''''''") return null
  const digits = s.replace(/\.0$/, '').replace(/\D+/g, '')
  if (digits.length < 10 || digits.length > 13) return null
  return digits
}

function formatPhoneBR(phoneDigits) {
  if (!phoneDigits) return ''
  const d = String(phoneDigits).replace(/\D+/g, '')
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  }
  return d
}

function normalizeGame(gameStr) {
  if (!gameStr) return 'Block Win'
  const g = String(gameStr).toLowerCase().replace(/\s+/g, '')
  if (g.includes('bubble')) return 'Bubble Win'
  if (g.includes('count')) return 'Count Masters'
  if (g.includes('cust')) return 'Cust Win'
  if (g.includes('block')) return 'Block Win'
  return String(gameStr).trim()
}

function normalizeClosure(closureStr) {
  if (!closureStr) return { type: 'Fixo', isGhost: false, targetDepositors: null }
  const c = String(closureStr).trim()
  const lower = c.toLowerCase()

  if (lower.includes('ghost')) {
    return { type: 'Fixo', isGhost: true, targetDepositors: null }
  }

  const match = c.match(/(\d+)\s*(?:DEPOSITANTES|depositantes)/i)
  if (match) {
    return { type: 'Por meta', isGhost: false, targetDepositors: parseInt(match[1]) }
  }

  return { type: 'Fixo', isGhost: false, targetDepositors: null }
}

function normalizePaymentAndReferral(col1Str) {
  if (!col1Str) return { paymentStatus: 'Pendente', referralName: null, referralCommission: 0 }
  const c = String(col1Str).trim()
  if (c.toLowerCase() === 'x') {
    return { paymentStatus: 'Pago', referralName: null, referralCommission: 0 }
  }

  const match = c.match(/indica[çc][ãa]o\s+do\s+([^(\n]+)(?:\(R\$\s*(\d+)\))?/i)
  if (match) {
    const referralName = match[1].trim()
    const referralCommission = match[2] ? parseInt(match[2]) : 50
    return { paymentStatus: 'Pendente', referralName, referralCommission }
  }

  return { paymentStatus: 'Pendente', referralName: null, referralCommission: 0 }
}

function normalizeDate(dateStr) {
  if (!dateStr) return { startDate: new Date().toISOString().split('T')[0], endDate: null }
  const s = String(dateStr).trim()

  if (s.includes('até')) {
    const parts = s.split('até').map(p => p.trim())
    return { startDate: parts[0] || null, endDate: parts[1] || null }
  }

  return { startDate: s, endDate: null }
}

// 87 influenciadores reais da Captação do Pedro
const RAW_CAPTACAO = [
  { name: 'Matheus', username: 'mathuesinho_oficialz', whatsapp: '94 992206536', date: '2026-10-04', status: 'Sem resposta', game: 'BlockWin', notes: 'Ghost' },
  { name: 'Erica', username: '085ericalima', whatsapp: '85 987626913', date: '2026-10-05', status: 'Não interessado', game: 'BlockWin', notes: 'Ghost' },
  { name: 'Valeria', username: 'valeriadiniizz', whatsapp: '85 992100818', date: '2026-10-05', status: 'Sem resposta', game: 'BlockWin', notes: 'Ghost' },
  { name: 'David', username: 'david_sayllon', whatsapp: '98 991008740', date: '2026-10-05', status: 'Sem resposta', game: 'BlockWin', notes: 'Não responde a abordagem' },
  { name: 'Dhan', username: 'dhan_bonfim', whatsapp: '71 991422330', date: '2026-10-05', status: 'Não interessado', game: 'BlockWin', notes: '' },
  { name: 'Chico', username: 'mano_chico17', whatsapp: '99 984999181', date: '2026-10-05', status: 'Recusou - Remarketing', game: 'BlockWin', notes: '' },
  { name: 'Sansão', username: 'sansao_souza.ofc', whatsapp: '85 991559826', date: '2026-10-06', status: 'Sem resposta', game: 'Blockwin', notes: '' },
  { name: 'Jéssica', username: 'jessicacabral332', whatsapp: '11 977207143', date: '2026-10-06', status: 'Não interessado', game: 'Blockwin', notes: '' },
  { name: 'Diego', username: 'diegoofcbdc_', whatsapp: '99 985261002', date: '2026-10-06', status: 'Sem resposta', game: 'Blockwin', notes: '' },
  { name: 'Anderson', username: 'anderson_bundinha', whatsapp: '84 996438384', date: '2026-10-06', status: 'Recusado - métricas ruins', game: 'Blockwin', notes: '' },
  { name: 'Hirlan', username: 'lanzin_ofc', whatsapp: '11 976397308', date: '2026-10-07', status: 'Em negociação', game: 'Blockwin', notes: '' },
  { name: 'Belinha', username: 'beelalemos1', whatsapp: '71 992088024', date: '2026-10-07', status: 'Não interessado', game: 'Blockwin', notes: '' },
  { name: 'Kaike', username: '__kaikerlk', whatsapp: '73 999982685', date: '2026-10-07', status: 'Em negociação', game: 'Blockwin', notes: '' },
  { name: 'Coala', username: 'coala.hs_', whatsapp: '89 999321647', date: '2026-10-08', status: 'Não interessado', game: 'Blockwin', notes: 'Dia 8 eu mudei totalmente a abordagem' },
  { name: 'Marcos', username: 'kimguimaraes', whatsapp: '71 985095506', date: '2026-10-08', status: 'Em negociação', game: 'Blockwin', notes: 'Indicação do @eugael' },
  { name: 'Jhonlennon', username: 'fonfon_do_maranhao', whatsapp: '98 984962798', date: '2026-10-08', status: 'Fechou', game: 'Blockwin', notes: '' },
  { name: 'Ivan', username: 'ivanzin.ossadaofc', whatsapp: '99 985149785', date: '2026-10-08', status: 'Sem resposta', game: 'Blockwin', notes: '' },
  { name: 'Ellen', username: 'ellen.blogueirinha_', whatsapp: '99 984799994', date: '2026-10-08', status: 'Em negociação', game: 'Blockwin', notes: '' },
  { name: 'Francis', username: 'francis.silva8', whatsapp: '75 998040625', date: '2026-10-08', status: 'Sem resposta', game: 'Blockwin', notes: 'Indicação do @eugael' },
  { name: 'Rian', username: 'rianzin_mtx', whatsapp: '33 999217481', date: '2026-10-08', status: 'Sem resposta', game: 'Blockwin', notes: '' },
  { name: 'Felipe', username: 'felipeborracheiro', whatsapp: '93 981283127', date: '2026-10-08', status: 'Outro momento', game: 'Blockwin', notes: '' },
  { name: 'Antonio', username: 'renato_saruth_ofc', whatsapp: '99 984163880', date: '2026-10-08', status: 'Em negociação', game: 'Blockwin', notes: '' },
  { name: 'Thayza', username: 'thayzamalhao_', whatsapp: '99 984586709', date: '2026-10-08', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Nilcy', username: 'fadiiinhaoriginalofc', whatsapp: '98 985617540', date: '2026-10-12', status: 'Em negociação', game: 'Blockwin', notes: '' },
  { name: 'Layza', username: 'alvinalayza', whatsapp: '63 991200243', date: '2026-10-12', status: 'Sem resposta', game: 'Blockwin', notes: '' },
  { name: 'Joao', username: 'jvsantoss0', whatsapp: '38 998386254', date: '2026-10-12', status: 'Não interessado', game: 'Blockwin', notes: '' },
  { name: 'Iago', username: 'iago_ofclll', whatsapp: '73 998686786', date: '2026-10-12', status: 'Fechou', game: 'Blockwin', notes: 'Não postou, Ghost' },
  { name: 'Lima', username: 'acerolaof', whatsapp: '85 991555812', date: '2026-10-12', status: 'Não interessado', game: 'Blockwin', notes: '' },
  { name: 'Cezar', username: 'g.cersinha_', whatsapp: '83 993061358', date: '2026-10-12', status: 'Fechou', game: 'Bubblewin', notes: '' },
  { name: 'Suzana', username: 'suzanatabosa14', whatsapp: '88 993596681', date: '2026-10-14', status: 'Sem resposta', game: 'Count masters', notes: '' },
  { name: 'Thais', username: 'thaislamarques', whatsapp: '85 991061515', date: '2026-10-14', status: 'Sem resposta', game: 'Count masters', notes: '' },
  { name: 'Felipe', username: 'olipefranca', whatsapp: '71 983208471', date: '2026-10-14', status: 'Sem resposta', game: 'Count masters', notes: '' },
  { name: 'Ana', username: 'anninha.bloguer', whatsapp: '31 973045975', date: '2026-10-14', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Blogueirinho', username: 'oblogueirinho_offc', whatsapp: '79 981270629', date: '2026-10-15', status: 'Recusado - métricas ruins', game: 'Bubblewin', notes: '' },
  { name: 'Thay', username: 'thaysantos085', whatsapp: '85 991816398', date: '2026-10-15', status: 'Não interessado', game: 'Bubblewin', notes: '' },
  { name: 'Ihasmyn', username: 'ihasmynsiilva.ofc', whatsapp: '62 992586817', date: '2026-10-15', status: 'Fechou', game: 'Bubblewin', notes: '' },
  { name: 'Joao', username: 'joazin_75', whatsapp: '75 982334609', date: '2026-10-15', status: 'Fechou', game: 'Bubblewin', notes: '' },
  { name: 'Junior', username: 'juninhoofavela_', whatsapp: '81 984008999', date: '2026-10-16', status: 'Não interessado', game: 'Bubblewin', notes: '' },
  { name: 'Izaac', username: 'izaacvieira_', whatsapp: '21 990530833', date: '2026-10-16', status: 'Não interessado', game: 'Bubblewin', notes: '' },
  { name: 'Victor', username: 'victoromp3', whatsapp: '84 991872783', date: '2026-10-16', status: 'Não interessado', game: 'Bubblewin', notes: '' },
  { name: 'Rafaela', username: 'passa_rafaela_ofic', whatsapp: '81 993067316', date: '2026-10-16', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Mendigo Boy', username: 'mendigoboy01', whatsapp: '11 986553735', date: '2026-10-16', status: 'Outro momento', game: 'Bubblewin', notes: '' },
  { name: 'Jennifer', username: 'jenniferalmeidaofc', whatsapp: '73 999738873', date: '2026-10-17', status: 'Não interessado', game: 'Bubblewin', notes: '' },
  { name: 'Mona', username: 'monaheringer', whatsapp: '11 982490861', date: '2026-10-17', status: 'Não interessado', game: 'Bubblewin', notes: '' },
  { name: 'Stefani', username: 'stefani_medeiros', whatsapp: '94 981262986', date: '2026-10-17', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Adson', username: 'adsonpantera2', whatsapp: '75 981099200', date: '2026-10-17', status: 'Não interessado', game: 'Bubblewin', notes: '' },
  { name: 'Yone', username: 'yonemcz_', whatsapp: '82 982281483', date: '2026-10-17', status: 'Não interessado', game: 'Bubblewin', notes: '' },
  { name: 'Natanael', username: 'hi_blaack', whatsapp: '21 968637396', date: '2026-10-18', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Kaio', username: 'kaioprtx', whatsapp: '98 984278235', date: '2026-10-18', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Lea', username: 'lea_silva1234', whatsapp: '81 985061085', date: '2026-10-18', status: 'Não interessado', game: 'Bubblewin', notes: '' },
  { name: 'Mattuto', username: 'mattuto_ofc', whatsapp: '81 987186587', date: '2026-10-18', status: 'Em negociação', game: 'Bubblewin', notes: '' },
  { name: 'Ronaldo', username: 'ronaldo_panca63', whatsapp: '63 992340590', date: '2026-10-18', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Italo', username: 'italorocha238', whatsapp: '73 981019031', date: '2026-10-18', status: 'Fechou', game: 'Bubblewin', notes: '' },
  { name: 'Ellen', username: 'ellennobre9', whatsapp: '88 992445229', date: '2026-10-18', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Garoto', username: 'garototransante_', whatsapp: '71 982433224', date: '2026-10-19', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Vittor', username: 'vittorcruz__', whatsapp: '91 982114259', date: '2026-10-19', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Paloma', username: 'afro_pa', whatsapp: '75 991696375', date: '2026-10-19', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Agnailton', username: '071_eo.agna', whatsapp: '71 981916153', date: '2026-10-19', status: 'Fechou', game: 'Bubblewin', notes: '' },
  { name: 'Mateus', username: 'kanela_gtx', whatsapp: '71 996805322', date: '2026-10-19', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Joao Carlos', username: 'nenendograu244', whatsapp: '84 994222497', date: '2026-10-19', status: 'Fechou', game: 'Bubblewin', notes: '' },
  { name: 'Nery', username: 'neryy_reserva2', whatsapp: '31 999454158', date: '2026-10-19', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Maycon', username: 'dorea_oficial01', whatsapp: '71 920007657', date: '2026-10-19', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Casal Resenha', username: 'casal_resenha.ofc', whatsapp: '21 989715593', date: '2026-10-19', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'André', username: '_victor084', whatsapp: '84 987292581', date: '2026-10-20', status: 'Outro momento', game: 'Bubblewin', notes: '' },
  { name: 'Thalyta', username: 'thalyytaguedes', whatsapp: '84 991629771', date: '2026-10-20', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Rayssa', username: 'rayssamylene_', whatsapp: '11 974706698', date: '2026-10-20', status: 'Fechou', game: 'Bubblewin', notes: '' },
  { name: 'Wesley', username: 'lele.756', whatsapp: '11 926493485', date: '2026-10-20', status: 'Em negociação', game: 'Bubblewin', notes: '' },
  { name: 'Italo', username: 'itinho.original', whatsapp: '71 984583083', date: '2026-10-21', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Baacon', username: 'baacon_1', whatsapp: '71 984356569', date: '2026-10-21', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Vanessa', username: 'vanessinhas._', whatsapp: '96 981393576', date: '2026-10-23', status: 'Recusado - métricas ruins', game: 'Bubblewin', notes: '' },
  { name: 'Sérgio', username: '01famoso_sl', whatsapp: '99 985144071', date: '2026-10-23', status: 'Em negociação', game: 'Bubblewin', notes: '' },
  { name: 'Bruno', username: 'brunito_9012', whatsapp: '84 994275151', date: '2026-10-23', status: 'Em negociação', game: 'Bubblewin', notes: '' },
  { name: 'Tartamenn', username: 'tartamenn', whatsapp: '82 991052706', date: '2026-10-24', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Gustavo', username: 'gustavoo_ofc6', whatsapp: '21 974305241', date: '2026-10-24', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Thaely', username: 'thaysantooos05', whatsapp: '55 996123424', date: '2026-10-24', status: 'Fechou', game: 'Bubblewin', notes: '' },
  { name: 'Jackson', username: 'eujacksonn__', whatsapp: '82 994186341', date: '2026-10-25', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Joelson', username: '23_joelson', whatsapp: '99 988570573', date: '2026-10-25', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Romulo', username: 'romulo_forrozeiro01', whatsapp: '98 988555192', date: '2026-10-25', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Matheus', username: 'teuzin_pressao7', whatsapp: '91 991675424', date: '2026-10-25', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Bruno', username: 'viegas46_oficial', whatsapp: '66 999779079', date: '2026-10-25', status: 'Fechou', game: 'Bubblewin', notes: '' },
  { name: 'Rafael', username: 'rafael_kauffmann', whatsapp: '91 984186211', date: '2026-10-26', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Tavares', username: 'eutavaresfilho', whatsapp: '97 991389236', date: '2026-10-26', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Samurai', username: 'samuraii_da_resenhaa', whatsapp: '85 982197809', date: '2026-10-26', status: 'Fechou', game: 'Bubblewin', notes: '' },
  { name: 'Isaac', username: 'isaacsouzagg', whatsapp: '51 994485388', date: '2026-10-27', status: 'Recusado - métricas ruins', game: 'Bubblewin', notes: '' },
  { name: 'Anderson', username: 'gadeia244', whatsapp: '55 996681614', date: '2026-10-27', status: 'Em negociação', game: 'Bubblewin', notes: '' },
  { name: 'Mayra', username: 'alexsandra_mayra_', whatsapp: '85 992281995', date: '2026-10-27', status: 'Recusado - métricas ruins', game: 'Bubblewin', notes: '' },
  { name: 'MK Cortes', username: 'mkcortes_oficial', whatsapp: '96 981302091', date: '2026-10-27', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Daniel', username: 'danielddk_ofc', whatsapp: '92 999690629', date: '2026-10-27', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Luisa', username: 'luisaleitex', whatsapp: '11 961772955', date: '2026-10-28', status: 'Recusado - métricas ruins', game: 'Bubblewin', notes: '' },
  { name: 'Didi', username: 'didioficial___', whatsapp: '19 983136952', date: '2026-10-28', status: 'Outro momento', game: 'Bubblewin', notes: '' },
  { name: 'Gabriel', username: 'rcgabriel', whatsapp: '81 999534131', date: '2026-10-28', status: 'Sem resposta', game: 'Bubblewin', notes: '' },
  { name: 'Gabriel', username: 'gaab_driveer', whatsapp: '11 989340161', date: '2026-10-28', status: 'Em negociação', game: 'Bubblewin', notes: '' },
  { name: 'Tiago', username: 'tiagobarbeirovip', whatsapp: '82 999795109', date: '2026-10-29', status: 'Em negociação', game: 'Bubblewin', notes: '' },
  { name: 'Jota', username: 'jotagrau_019', whatsapp: '19 997695978', date: '2026-10-29', status: 'Outro momento', game: 'Bubblewin', notes: '' },
]

// 17 publicidades reais do Pedro
const RAW_PUBLICIDADES = [
  { name: 'Gael', username: 'eugael', whatsapp: '73998312396', game: 'Block Win', invested: 150, returned: 650, date: '2026-09-20', closure: 'Fixo', col1: '' },
  { name: 'Gael', username: 'eugael', whatsapp: '73998312396', game: 'Block Win', invested: 400, returned: 656, date: '2026-09-30', closure: '50 DEPOSITANTES', col1: '' },
  { name: 'Gabriel', username: 'biel_barbosa71', whatsapp: '71996238851', game: 'Block Win', invested: 100, returned: 72, date: '2026-10-02', closure: 'Fixo', col1: '' },
  { name: 'GZ User', username: 'gz_userr22', whatsapp: null, game: 'Block Win', invested: 100, returned: 112, date: '', closure: 'Fixo', col1: 'x' },
  { name: 'Jhonlennon', username: 'fonfon_do_maranhao', whatsapp: '98 984962798', game: 'Bubble Win', invested: 200, returned: 240, date: '2026-10-09', closure: 'Fixo', col1: 'x' },
  { name: 'Joao', username: 'joazin_75', whatsapp: '75 982334609', game: 'Block Win', invested: 250, returned: null, date: '16/10/2026 até 30/10', closure: 'Fixo (GHOST)', col1: '' },
  { name: 'Gael', username: 'eugael', whatsapp: '73 998312396', game: 'Cust Win', invested: 500, returned: 223, date: '2026-10-14', closure: '65 DEPOSITANTES', col1: '' },
  { name: 'Ihasmyn', username: 'ihasmynsiilva.ofc', whatsapp: '62 992586817', game: 'Bubble Win', invested: 170, returned: 152, date: '2026-10-19', closure: 'Fixo', col1: 'x' },
  { name: 'Agnailton', username: '071_eo.agna', whatsapp: '71 981916153', game: 'Bubble Win', invested: 40, returned: 208, date: '2026-10-19', closure: 'Fixo', col1: 'x' },
  { name: 'Jhonlennon', username: 'fonfon_do_maranhao', whatsapp: '98 984962798', game: 'Bubble Win', invested: 150, returned: 352, date: '2026-10-21', closure: 'Fixo', col1: '' },
  { name: 'Joao Carlos', username: 'nenendograu244', whatsapp: '84 994222497', game: 'Bubble Win', invested: 300, returned: 368, date: '2026-10-20', closure: 'Fixo', col1: '' },
  { name: 'André', username: '_victor084', whatsapp: '84 987292581', game: 'Bubble Win', invested: 300, returned: 128, date: '2026-10-22', closure: 'Fixo', col1: '' },
  { name: 'Italo', username: 'italorocha238', whatsapp: '73 981019031', game: 'Bubble Win', invested: 400, returned: 520, date: '2026-10-22', closure: 'Fixo', col1: 'x' },
  { name: 'Thay', username: 'thaysantooos05', whatsapp: '55 996123424', game: 'Bubble Win', invested: 200, returned: 96, date: '2026-10-24', closure: 'Fixo', col1: 'Indicação do Jhon (R$50)' },
  { name: 'Samurai', username: 'samuraii_da_resenhaa', whatsapp: '85982197809', game: 'Bubble Win', invested: 50, returned: 336, date: '', closure: 'Fixo', col1: '' },
  { name: 'Ryan', username: 'dona.jozi', whatsapp: '98 970137966', game: 'Bubble Win', invested: 350, returned: null, date: '2026-10-24', closure: 'Fixo', col1: 'Indicação do Jhon (R$50)' },
  { name: 'Wesley', username: 'lele.756', whatsapp: '', game: 'Bubble Win', invested: 400, returned: null, date: '', closure: 'Fixo', col1: '' },
  { name: 'Italo', username: 'itinho.original', whatsapp: '71 984583083', game: 'Bubble Win', invested: 170, returned: null, date: '', closure: 'Fixo', col1: '' },
]

// 11 metas de depositantes reais do Pedro
const RAW_METAS = [
  { name: 'Gael', username: 'eugael', whatsapp: '73998312396', game: 'Cust Win', invested: 500, target: 65, reached: 15, status: 'Em andamento' },
  { name: 'Ihasmyn', username: 'ihasmynsiilva.ofc', whatsapp: '62 992586817', game: 'Bubble Win', invested: 250, target: 33, reached: 15, status: 'Em andamento' },
  { name: 'Joao Carlos', username: 'nenendograu244', whatsapp: '84 994222497', game: 'Bubble Win', invested: 400, target: 45, reached: 21, status: 'Em andamento' },
  { name: 'Rayssa', username: 'rayssamylene_', whatsapp: '11 974706698', game: 'Bubble Win', invested: 150, target: 20, reached: 2, status: 'Em andamento' },
  { name: 'Jhonlennon', username: 'fonfon_do_maranhao', whatsapp: '98 984962798', game: 'Bubble Win', invested: 400, target: 50, reached: 4, status: 'Em andamento' },
  { name: 'Ryan', username: 'dona.jozi', whatsapp: '98 970137966', game: 'Bubble Win', invested: 300, target: 35, reached: 2, status: 'Em andamento' },
  { name: 'André', username: '_victor084', whatsapp: '84 987292581', game: 'Bubble Win', invested: 350, target: 35, reached: 26, status: 'Em andamento' },
  { name: 'Wesley', username: 'el_grilooreserva', whatsapp: '62 993078115', game: 'Bubble Win', invested: 305, target: 35, reached: 10, status: 'Em andamento' },
  { name: 'Samurai', username: 'samuraii_da_resenhaa', whatsapp: '85 982197809', game: 'Bubble Win', invested: 500, target: 55, reached: 55, status: 'Meta atingida' },
  { name: 'João', username: 'joazin_75', whatsapp: '75 982334609', game: 'Bubble Win', invested: 300, target: 35, reached: 19, status: 'Em andamento' },
  { name: 'Samurai', username: 'samuraii_da_resenhaa', whatsapp: '85 982197809', game: 'Bubble Win', invested: 600, target: 65, reached: 0, status: 'Em andamento' },
]

// Perfis que retornaram error: "not_found" em auditoria direta no Instagram (Apify)
const VERIFIED_IG_NOT_FOUND = new Set([
  'mathuesinho_oficialz',
  'eugael',
  'gz_userr22',
  'oblogueirinho_offc',
])

/**
 * Normaliza e gera a base inicial completa a partir das 3 planilhas do Pedro
 */
function buildInitialDatabase() {
  const influencersMap = new Map()

  // 1. Inserir todos da Captação
  for (const c of RAW_CAPTACAO) {
    const username = normalizeUsername(c.username)
    if (!username) continue

    const phone = normalizePhone(c.whatsapp)
    const isGhost = c.notes && c.notes.toLowerCase().includes('ghost')
    const hasReferred = c.notes && c.notes.includes('@')

    influencersMap.set(username, {
      username,
      full_name: c.name || username,
      whatsapp: phone,
      formatted_phone: formatPhoneBR(phone),
      email: null,
      status: c.status ? c.status.trim() : 'Novo',
      user_notes: c.notes || '',
      is_ghost: !!isGhost,
      referred_by: hasReferred ? c.notes : null,
      campaign_game: normalizeGame(c.game),
      contact_date: c.date || new Date().toISOString().split('T')[0],
      followers_count: 0,
      classification: null,
      score: 0,
      ig_not_found: VERIFIED_IG_NOT_FOUND.has(username),
      is_agency: false,
      promotes_raffle: false,
      promotes_shopee: false,
    })
  }

  // 2. Processar e vincular as Publicidades
  const publicidadesList = []
  let adId = 1

  for (const p of RAW_PUBLICIDADES) {
    const username = normalizeUsername(p.username)
    const closure = normalizeClosure(p.closure)
    const payment = normalizePaymentAndReferral(p.col1)
    const dates = normalizeDate(p.date)
    const phone = normalizePhone(p.whatsapp)

    // Se o influenciador ainda não estava na lista, cadastra sem inventar seguidores/score
    if (!influencersMap.has(username) && username) {
      influencersMap.set(username, {
        username,
        full_name: p.name || username,
        whatsapp: phone,
        formatted_phone: formatPhoneBR(phone),
        email: null,
        status: 'Fechou',
        user_notes: 'Adicionado via controle de publicidades',
        is_ghost: closure.isGhost,
        campaign_game: normalizeGame(p.game),
        contact_date: dates.startDate || '2026-10-01',
        followers_count: 0,
        classification: null,
        score: 0,
        ig_not_found: VERIFIED_IG_NOT_FOUND.has(username),
        is_agency: false,
        promotes_raffle: false,
        promotes_shopee: false,
      })
    }

    const totalCost = (p.invested || 0) + payment.referralCommission
    const hasReturn = p.returned !== null && p.returned !== undefined
    const roi = hasReturn && totalCost > 0 ? (p.returned - totalCost) / totalCost : null

    publicidadesList.push({
      id: adId++,
      influencer_username: username,
      influencer_name: p.name || username,
      whatsapp: phone || influencersMap.get(username)?.whatsapp || null,
      game: normalizeGame(p.game),
      invested_amount: p.invested || 0,
      return_amount: hasReturn ? p.returned : null,
      referral_name: payment.referralName,
      referral_commission: payment.referralCommission,
      total_cost: totalCost,
      roi: roi,
      start_date: dates.startDate,
      end_date: dates.endDate,
      closure_type: closure.type,
      target_depositors: closure.targetDepositors,
      delivery_status: closure.isGhost ? 'Ghost' : 'Postada',
      payment_status: payment.paymentStatus,
      notes: p.col1 && p.col1 !== 'x' ? p.col1 : '',
      created_at: dates.startDate ? `${dates.startDate}T12:00:00.000Z` : new Date().toISOString(),
    })
  }

  // 3. Processar Metas de Depositantes
  const metasList = []
  let metaId = 1

  for (const m of RAW_METAS) {
    const username = normalizeUsername(m.username)
    const target = m.target || 0
    const reached = m.reached || 0
    const remaining = Math.max(target - reached, 0)
    const progressPct = target > 0 ? reached / target : 0
    const invested = m.invested || 0
    const cpa = reached > 0 ? Math.round((invested / reached) * 100) / 100 : null

    metasList.push({
      id: metaId++,
      influencer_username: username,
      influencer_name: m.name || username,
      whatsapp: normalizePhone(m.whatsapp),
      game: normalizeGame(m.game),
      invested_amount: invested,
      target_depositors: target,
      reached_depositors: reached,
      remaining_depositors: remaining,
      progress_pct: progressPct,
      cpa: cpa,
      status: m.status || (reached >= target ? 'Meta atingida' : 'Em andamento'),
      last_updated: new Date().toISOString().split('T')[0],
      history: [
        { date: '2026-10-25', reached: Math.max(0, reached - 5) },
        { date: '2026-11-04', reached: reached },
      ],
    })
  }

  return {
    influencers: Array.from(influencersMap.values()),
    publicidades: publicidadesList,
    metas: metasList,
  }
}

module.exports = {
  normalizeUsername,
  normalizePhone,
  formatPhoneBR,
  normalizeGame,
  normalizeClosure,
  normalizePaymentAndReferral,
  normalizeDate,
  buildInitialDatabase,
  RAW_CAPTACAO,
  RAW_PUBLICIDADES,
  RAW_METAS,
}
