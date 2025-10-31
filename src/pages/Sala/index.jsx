import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Users, Clock, CheckCircle } from 'lucide-react';
import CameraReconhecimento from '../../Components/CameraReconhecimento';

/**
 * Página Sala - Exibe os alunos de uma sala específica
 * 
 * Esta página mostra todos os alunos matriculados em uma sala,
 * permitindo fazer chamada com reconhecimento facial ou manual.
 * 
 * Funcionalidades:
 * - Lista todos os alunos da sala com fotos
 * - Reconhecimento facial automático
 * - Interface para marcar presença
 * - Informações da turma e professor
 */
const Sala = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [salaInfo, setSalaInfo] = useState(null);
  const [alunos, setAlunos] = useState([]);
  const [chamadaIniciada, setChamadaIniciada] = useState(false);
  const [presencas, setPresencas] = useState({});
  const [cameraAtiva, setCameraAtiva] = useState(false);

  // Dados mock das salas
  const salas = {
    1: {
      nome: "1º Ano A",
      turma: "Ensino Médio",
      professor: "Prof. Maria Silva",
      periodo: "Manhã",
      totalAlunos: 32
    },
    2: {
      nome: "1º Ano B", 
      turma: "Ensino Médio",
      professor: "Prof. João Santos",
      periodo: "Manhã",
      totalAlunos: 28
    },
    3: {
      nome: "2º Ano A",
      turma: "Ensino Médio", 
      professor: "Prof. Ana Costa",
      periodo: "Tarde",
      totalAlunos: 30
    },
    4: {
      nome: "2º Ano B",
      turma: "Ensino Médio",
      professor: "Prof. Carlos Lima",
      periodo: "Tarde",
      totalAlunos: 25
    },
    5: {
      nome: "3º Ano A",
      turma: "Ensino Médio",
      professor: "Prof. Lucia Ferreira",
      periodo: "Manhã",
      totalAlunos: 29
    },
    6: {
      nome: "3º Ano B",
      turma: "Ensino Médio",
      professor: "Prof. Roberto Souza",
      periodo: "Tarde",
      totalAlunos: 27
    }
  };

  // Gerar alunos fictícios para cada sala
  const gerarAlunosFicticios = (salaId, totalAlunos) => {
    const nomes = [
      "Ana Clara", "João Pedro", "Maria Eduarda", "Gabriel Silva", "Larissa Santos",
      "Rafael Costa", "Beatriz Oliveira", "Lucas Ferreira", "Camila Rodrigues", "Matheus Lima",
      "Sophia Almeida", "Pedro Henrique", "Isabella Martins", "Enzo Barbosa", "Manuela Dias",
      "Arthur Pereira", "Helena Carvalho", "Davi Nascimento", "Alice Ribeiro", "Bernardo Souza",
      "Valentina Gomes", "Lorenzo Araújo", "Júlia Rocha", "Heitor Campos", "Lara Moreira",
      "Miguel Cardoso", "Cecília Freitas", "Théo Correia", "Aurora Pinto", "Samuel Castro",
      "Antonella Nunes", "Benício Teixeira", "Melissa Barros", "Noah Cavalcanti", "Maite Rezende"
    ];

    const sobrenomes = [
      "Silva", "Santos", "Oliveira", "Costa", "Rodrigues", "Ferreira", "Almeida", "Pereira",
      "Lima", "Barbosa", "Ribeiro", "Martins", "Carvalho", "Gomes", "Rocha", "Dias",
      "Nascimento", "Araújo", "Campos", "Moreira", "Cardoso", "Freitas", "Correia", "Pinto"
    ];

    const alunos = [];
    const nomesUsados = new Set();

    for (let i = 1; i <= totalAlunos; i++) {
      let nomeCompleto;
      do {
        const nome = nomes[Math.floor(Math.random() * nomes.length)];
        const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
        nomeCompleto = `${nome} ${sobrenome}`;
      } while (nomesUsados.has(nomeCompleto));
      
      nomesUsados.add(nomeCompleto);

      alunos.push({
        id: i,
        nome: nomeCompleto,
        matricula: `2024${salaId.toString().padStart(2, '0')}${i.toString().padStart(3, '0')}`,
        foto: `https://images.unsplash.com/photo-${1500000000000 + (parseInt(salaId) * 1000) + i}?w=150&h=150&fit=crop&crop=face&auto=format&q=80`,
        presente: false,
        horarioChegada: null
      });
    }

    return alunos;
  };

  // Função para carregar dados salvos pelo administrador
  const carregarDadosAdmin = () => {
    try {
      // Carregar alunos do localStorage (salvos pelo admin)
      const alunosAdmin = localStorage.getItem('admin_alunos');
      const salasAdmin = localStorage.getItem('admin_salas');
      
      if (alunosAdmin && salasAdmin) {
        const { dados: alunosSalvos } = JSON.parse(alunosAdmin);
        const { dados: salasSalvas } = JSON.parse(salasAdmin);
        
        console.log('🔄 Carregando dados do administrador...');
        console.log('📚 Alunos salvos:', alunosSalvos);
        console.log('🏫 Salas salvas:', salasSalvas);
        
        return { 
          alunosAdmin: alunosSalvos, 
          salasAdmin: salasSalvas 
        };
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar dados do admin:', error);
    }
    
    return { alunosAdmin: null, salasAdmin: null };
  };

  useEffect(() => {
    const { alunosAdmin, salasAdmin } = carregarDadosAdmin();
    
    // Tentar encontrar a sala nos dados do admin primeiro
    let salaEncontrada = null;
    if (salasAdmin) {
      // Normalizar ids para Number para comparação confiável
      const salasNorm = salasAdmin.map(s => ({ ...s, id: Number(s.id) }));
      salaEncontrada = salasNorm.find(s => s.id == Number(id));
      console.log('🔍 Procurando sala ID:', id, '- Encontrada:', salaEncontrada);
    }
    
    // Se não encontrou nos dados admin, usar dados mock
    if (!salaEncontrada) {
      salaEncontrada = salas[id];
      console.log('📝 Usando dados mock para sala:', salaEncontrada);
    }
    
    if (salaEncontrada) {
      setSalaInfo(salaEncontrada);
      
      // Tentar carregar alunos reais do admin para esta sala
      if (alunosAdmin) {
  const alunosDaSala = alunosAdmin.filter(aluno => Number(aluno.salaId) == Number(id));
        
        if (alunosDaSala.length > 0) {
          console.log(`✅ Carregados ${alunosDaSala.length} alunos REAIS da sala ${id}:`, alunosDaSala);
          // Converter formato para compatibilidade com a interface
          const alunosFormatados = alunosDaSala.map(aluno => ({
            id: aluno.id,
            nome: aluno.nome,
            matricula: aluno.matricula,
            email: aluno.email,
            telefone: aluno.telefone,
            foto: aluno.foto || `https://images.unsplash.com/photo-${1500 + aluno.id}?w=150&h=150&fit=crop&crop=face`,
            presente: false,
            horarioChegada: null
          }));
          setAlunos(alunosFormatados);
        } else {
          console.log(`📝 Nenhum aluno real encontrado para sala ${id}, gerando alunos fictícios`);
          const alunosGerados = gerarAlunosFicticios(id, salaEncontrada.totalAlunos);
          setAlunos(alunosGerados);
        }
      } else {
        console.log('📝 Dados admin não encontrados, usando alunos fictícios');
        const alunosGerados = gerarAlunosFicticios(id, salaEncontrada.totalAlunos);
        setAlunos(alunosGerados);
      }
    } else {
      console.error('❌ Sala não encontrada:', id);
    }
  }, [id]);

  /**
   * Marcar/desmarcar presença de um aluno
   */
  const togglePresenca = (alunoId) => {
    const agora = new Date().toLocaleTimeString('pt-BR');
    setPresencas(prev => ({
      ...prev,
      [alunoId]: prev[alunoId] ? null : agora
    }));
  };

  /**
   * Iniciar/parar câmera
   */
  const toggleCamera = () => {
    setCameraAtiva(!cameraAtiva);
    setChamadaIniciada(!cameraAtiva);
  };

  /**
   * Callback quando a câmera detecta alunos
   */
  const handleAlunosDetectados = (alunosIdentificados) => {
    const agora = new Date().toLocaleTimeString('pt-BR');
    const novasPresencas = { ...presencas };
    
    alunosIdentificados.forEach(aluno => {
      if (!novasPresencas[aluno.id]) {
        novasPresencas[aluno.id] = agora;
      }
    });
    
    setPresencas(novasPresencas);
  };

  /**
   * Função para salvar a chamada do reconhecimento facial
   */
  const salvarChamadaReconhecimento = () => {
    const totalPresentes = Object.keys(presencas).length;
    const totalAusentes = alunos.length - totalPresentes;

    if (totalPresentes === 0) {
      alert('Nenhum aluno foi detectado pela câmera ainda.\n\nInicie o reconhecimento facial e aguarde alguns alunos serem identificados antes de salvar.');
      return;
    }

    const confirmar = window.confirm(
      `Salvar chamada da sala "${salaInfo.nome}"?\n\n` +
      `✅ Presentes: ${totalPresentes}\n` +
      `❌ Ausentes: ${totalAusentes}\n` +
      `📊 Taxa de presença: ${Math.round((totalPresentes/alunos.length)*100)}%\n\n` +
      `Tipo: Reconhecimento Facial`
    );

    if (!confirmar) return;

    // Criar registro da chamada com dados do reconhecimento
    const registroChamada = {
      sala: salaInfo.nome,
      salaId: salaInfo.id || id,
      data: new Date().toISOString(),
      tipo: 'reconhecimento_facial',
      presencas: totalPresentes,
      ausencias: totalAusentes,
      alunos: alunos.map(aluno => ({
        nome: aluno.nome,
        matricula: aluno.matricula,
        presente: !!presencas[aluno.id],
        horarioDeteccao: presencas[aluno.id] || null
      }))
    };

    // Salvar no localStorage
    const chamadasExistentes = JSON.parse(localStorage.getItem('chamadas_realizadas') || '[]');
    chamadasExistentes.push(registroChamada);
    localStorage.setItem('chamadas_realizadas', JSON.stringify(chamadasExistentes));

    alert(`✅ Chamada salva com sucesso!\n\n` +
          `📚 Sala: ${salaInfo.nome}\n` +
          `👥 Presentes: ${totalPresentes}/${alunos.length}\n` +
          `⏰ Data: ${new Date().toLocaleString('pt-BR')}\n` +
          `🤖 Método: Reconhecimento Facial`);
  };

  /**
   * Componente do Card do Aluno
   */
  const CardAluno = ({ aluno }) => {
    const presente = presencas[aluno.id];
    
    return (
      <div 
        className={`bg-white rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer hover:shadow-lg ${
          presente 
            ? 'border-green-200 bg-green-50' 
            : 'border-gray-200 hover:border-blue-200'
        }`}
        onClick={() => togglePresenca(aluno.id)}
      >
        <div className="text-center">
          {/* Foto do Aluno */}
          <div className="relative mx-auto mb-3">
            <img
              src={aluno.foto}
              alt={aluno.nome}
              className={`w-16 h-16 rounded-full object-cover border-3 mx-auto ${
                presente ? 'border-green-400' : 'border-gray-300'
              }`}
              onError={(e) => {
                // Fallback para avatar com iniciais se a imagem não carregar
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Avatar de fallback com iniciais */}
            <div 
              className={`w-16 h-16 rounded-full border-3 mx-auto items-center justify-center text-white font-bold text-lg hidden ${
                presente ? 'border-green-400 bg-green-500' : 'border-gray-300 bg-gray-500'
              }`}
            >
              {aluno.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            
            {/* Indicador de presença */}
            {presente && (
              <div className="absolute -top-1 -right-1">
                <CheckCircle className="w-6 h-6 text-green-500 bg-white rounded-full" />
              </div>
            )}
          </div>

          {/* Nome do Aluno */}
          <h4 className={`font-semibold text-sm mb-1 ${presente ? 'text-green-800' : 'text-gray-800'}`}>
            {aluno.nome}
          </h4>
          
          {/* Matrícula */}
          <p className="text-xs text-gray-500 mb-2">
            Mat: {aluno.matricula}
          </p>

          {/* Status de Presença */}
          {presente ? (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
              ✓ Presente - {presente}
            </div>
          ) : (
            <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
              Ausente
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!salaInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Sala não encontrada</h1>
          <button 
            onClick={() => navigate('/alunos')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar às Salas
          </button>
        </div>
      </div>
    );
  }

  const totalPresentes = Object.keys(presencas).length;
  const porcentagemPresenca = ((totalPresentes / alunos.length) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da Sala */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Botão Voltar */}
              <button
                onClick={() => navigate('/alunos')}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar</span>
              </button>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {salaInfo.nome}
                </h1>
                <p className="text-gray-600">
                  {salaInfo.professor} • {salaInfo.periodo} • {salaInfo.turma}
                </p>
              </div>
            </div>

            {/* Estatísticas de Presença */}
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {totalPresentes}/{alunos.length}
              </div>
              <div className="text-sm text-gray-600">
                {porcentagemPresenca}% presentes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Chamada */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Camera className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Reconhecimento Facial Automático</h2>
              <p className="text-gray-600 text-sm">Aponte a câmera para a sala - o sistema identificará automaticamente quem está presente</p>
            </div>
          </div>          <div className="flex space-x-3">
              {/* Botão Limpar */}
              {totalPresentes > 0 && (
                <button
                  onClick={() => setPresencas({})}
                  className="flex items-center space-x-2 px-4 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  <Clock className="w-5 h-5" />
                  <span>Limpar</span>
                </button>
              )}
            </div>
          </div>

          {/* Barra de Progresso */}
          {totalPresentes > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progresso da Chamada</span>
                <span>{porcentagemPresenca}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${porcentagemPresenca}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Componente de Câmera Real */}
        <CameraReconhecimento
          isActive={cameraAtiva}
          onToggleCamera={toggleCamera}
          onAlunosDetectados={handleAlunosDetectados}
          className="mb-6"
        />

        {/* Grid de Alunos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {alunos.map((aluno) => (
            <CardAluno key={aluno.id} aluno={aluno} />
          ))}
        </div>

        {/* Resumo da Chamada */}
        {totalPresentes > 0 && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Resumo da Chamada</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mb-6">
              <div>
                <div className="text-2xl font-bold text-green-600">{totalPresentes}</div>
                <div className="text-sm text-green-700">Presentes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{alunos.length - totalPresentes}</div>
                <div className="text-sm text-red-700">Ausentes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{porcentagemPresenca}%</div>
                <div className="text-sm text-blue-700">Taxa de Presença</div>
              </div>
            </div>
            
            {/* Botão Salvar Chamada */}
            <div className="text-center">
              <button
                onClick={salvarChamadaReconhecimento}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 mx-auto"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Salvar Chamada</span>
              </button>
              <p className="text-sm text-green-600 mt-2">
                Salva a chamada com os alunos detectados pelo reconhecimento facial
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sala;