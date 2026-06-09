import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Image,
  Modal,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Tarefa = {
  id: string;
  texto: string;
  concluida: boolean;
  imagem?: string;
  data: string;
  hora: string;
};

export default function HomeScreen() {
  const [tarefa, setTarefa] = useState('');
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [imagemTemp, setImagemTemp] = useState('');

  // Carregar tarefas salvas
  useEffect(() => {
    carregarTarefas();
  }, []);

  // Salvar tarefas sempre que mudar
  useEffect(() => {
    salvarTarefas();
  }, [tarefas]);

  const carregarTarefas = async () => {
    try {
      const tarefasSalvas = await AsyncStorage.getItem('@tarefas');
      if (tarefasSalvas) {
        setTarefas(JSON.parse(tarefasSalvas));
      }
    } catch (error) {
      console.error('Erro ao carregar:', error);
    }
  };

  const salvarTarefas = async () => {
    try {
      await AsyncStorage.setItem('@tarefas', JSON.stringify(tarefas));
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const pegarImagem = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso às suas fotos!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImagemTemp(result.assets[0].uri);
    }
  };

  const tirarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos acesso à sua câmera!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImagemTemp(result.assets[0].uri);
    }
  };

  const adicionarTarefa = () => {
    if (!tarefa.trim()) {
      Alert.alert('Aviso', 'Digite uma tarefa!');
      return;
    }

    const agora = new Date();
    const novaTarefa: Tarefa = {
      id: Date.now().toString(),
      texto: tarefa,
      concluida: false,
      imagem: imagemTemp,
      data: agora.toLocaleDateString('pt-BR'),
      hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setTarefas([novaTarefa, ...tarefas]);
    setTarefa('');
    setImagemTemp('');
    setModalVisible(false);
  };

  const alternarConcluida = (id: string) => {
    setTarefas(
      tarefas.map((item) =>
        item.id === id ? { ...item, concluida: !item.concluida } : item
      )
    );
  };

  // FUNÇÃO REMOVER CORRIGIDA
 // Substitua a função removerTarefa por esta versão SEM ALERT
const removerTarefa = (id: string) => {
  console.log('Tentando remover tarefa:', id);
  const novasTarefas = tarefas.filter((item) => item.id !== id);
  console.log('Tarefas após filtro:', novasTarefas.length);
  setTarefas(novasTarefas);
};

  const getDataHoje = () => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const tarefasHoje = tarefas.filter(t => t.data === hoje);
    return tarefasHoje.length;
  };

  const renderItem = ({ item }: { item: Tarefa }) => (
    <View style={[styles.itemContainer, item.concluida && styles.itemConcluido]}>
      <TouchableOpacity 
        style={styles.checkButton}
        onPress={() => alternarConcluida(item.id)}
      >
        <View style={[styles.checkCircle, item.concluida && styles.checkCircleActive]}>
          {item.concluida && <Text style={styles.checkMark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <View style={styles.itemContent}>
        <Text style={[styles.itemTexto, item.concluida && styles.textoConcluido]}>
          {item.texto}
        </Text>
        
        <View style={styles.itemMeta}>
          <Text style={styles.metaText}>📅 {item.data}</Text>
          <Text style={styles.metaText}>⏰ {item.hora}</Text>
        </View>

        {item.imagem && (
          <Image source={{ uri: item.imagem }} style={styles.itemImagem} />
        )}
      </View>

      <TouchableOpacity onPress={() => removerTarefa(item.id)} style={styles.deleteButton}>
        <Text style={styles.deleteText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>✅ Minhas Tarefas</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{tarefas.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{tarefas.filter(t => t.concluida).length}</Text>
            <Text style={styles.statLabel}>Concluídas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{getDataHoje()}</Text>
            <Text style={styles.statLabel}>Hoje</Text>
          </View>
        </View>
      </View>

      {/* Lista de Tarefas */}
      <FlatList
        data={tarefas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listaContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>Nenhuma tarefa cadastrada</Text>
            <Text style={styles.emptySubtext}>Toque no botão + para adicionar</Text>
          </View>
        }
      />

      {/* Botão Flutuante */}
      <TouchableOpacity 
        style={styles.fabButton}
        onPress={() => {
          setImagemTemp('');
          setTarefa('');
          setModalVisible(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal de Adicionar Tarefa */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Nova Tarefa</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="O que precisa fazer?"
              placeholderTextColor="#999"
              value={tarefa}
              onChangeText={setTarefa}
              multiline
            />

            <Text style={styles.modalSubTitulo}>Adicionar imagem (opcional)</Text>
            
            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.imageButton} onPress={pegarImagem}>
                <Text style={styles.imageButtonText}>📷 Galeria</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageButton} onPress={tirarFoto}>
                <Text style={styles.imageButtonText}>📸 Câmera</Text>
              </TouchableOpacity>
            </View>

            {imagemTemp ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imagemTemp }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setImagemTemp('')}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={adicionarTarefa}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 12,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3498db',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  listaContainer: {
    padding: 15,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemConcluido: {
    backgroundColor: '#f0f8ff',
    opacity: 0.8,
  },
  checkButton: {
    marginRight: 12,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#3498db',
  },
  checkMark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
  },
  itemTexto: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 6,
  },
  textoConcluido: {
    textDecorationLine: 'line-through',
    color: '#adb5bd',
  },
  itemMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 11,
    color: '#6c757d',
    marginRight: 12,
  },
  itemImagem: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 20,
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalSubTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 10,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  imageButtonText: {
    fontSize: 14,
    color: '#495057',
  },
  previewContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3498db',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
  },
});