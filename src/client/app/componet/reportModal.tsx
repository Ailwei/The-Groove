import React, { useState } from 'react';
import { Modal, View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ReportModalProps {
  visible: boolean;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ visible, onSubmit, onClose }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason.trim());
      setReason('');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>Report Groove</Text>
          <Text style={styles.subtitle}>Please tell us why you are reporting this groove:</Text>

          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Enter reason..."
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f9fafb',
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#9ca3af',
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ReportModal;
