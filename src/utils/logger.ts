import winston from 'winston';
import fs from 'fs'; 

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'scraper.log' })
  ]
});


export const logAsync = async (level: string, message: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    logger.log(level, message, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};


export function loggerTXT(level: string, message: string) {

  const data = {
    level,
    message,
    timestamp: new Date().toISOString(), // Adiciona um timestamp para melhor rastreamento
  };

  // Formata os dados como uma string
  const logEntry = `${data.timestamp} [${data.level}]: ${data.message}\n`;

  // Define o caminho do arquivo de log
  const filePath = 'log.txt';

  // Adiciona a nova entrada de log ao final do arquivo
  try {
    fs.appendFileSync(filePath, logEntry, 'utf-8');
    console.log('Log adicionado com sucesso.');
  } catch (error) {
    console.error('Erro ao gravar o log:', error);
  }
}
