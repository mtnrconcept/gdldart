#!/usr/bin/env node

/**
 * Script de vérification de la connectivité au service de détection DeepDarts
 * Usage: node scripts/check-backend.js [url]
 */

const http = require('http');
const https = require('https');
const os = require('os');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function getLocalIPAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name: name,
          address: iface.address,
        });
      }
    }
  }

  return addresses;
}

async function checkEndpoint(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (url.startsWith('https') ? 443 : 80),
      path: urlObj.pathname,
      method: 'GET',
      timeout: 5000,
    };

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          success: true,
          status: res.statusCode,
          statusMessage: res.statusMessage,
          data: data,
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout (5 secondes)',
      });
    });

    req.end();
  });
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
  log('║  Vérification du service de détection DeepDarts          ║', 'bright');
  log('╚════════════════════════════════════════════════════════════╝\n', 'bright');

  // Afficher les adresses IP locales
  log('📍 Adresses IP locales disponibles:', 'cyan');
  const localIPs = getLocalIPAddresses();
  if (localIPs.length === 0) {
    log('   Aucune interface réseau trouvée', 'yellow');
  } else {
    for (const ip of localIPs) {
      log(`   ${ip.name}: ${ip.address}`, 'blue');
    }
  }
  console.log();

  // URL à tester
  const customUrl = process.argv[2];
  const testUrls = [];

  if (customUrl) {
    log(`🔍 Test de l'URL fournie: ${customUrl}`, 'cyan');
    testUrls.push(customUrl);
  } else {
    log('🔍 Test des URLs par défaut...', 'cyan');

    // Ajouter les URLs locales basées sur les IPs trouvées
    for (const ip of localIPs) {
      testUrls.push(`http://${ip.address}:8000/api/detect`);
    }

    // Ajouter le service distant
    testUrls.push('https://deep-darts.fly.dev/api/detect');
  }

  console.log();

  // Tester chaque URL
  for (const url of testUrls) {
    log(`\n🎯 Test: ${url}`, 'bright');
    const result = await checkEndpoint(url);

    if (result.success) {
      if (result.status === 200 || result.status === 405) {
        // 405 = Method Not Allowed (normal pour GET sur /api/detect)
        log('   ✅ Service accessible !', 'green');
        log(`   Status: ${result.status} ${result.statusMessage}`, 'green');
        if (result.status === 405) {
          log('   Note: 405 est normal (POST requis pour la détection)', 'yellow');
        }
        log(`\n   📝 Configurez cette URL dans .env:`, 'cyan');
        log(`   EXPO_PUBLIC_DART_DETECTION_URL=${url}`, 'bright');
      } else {
        log(`   ⚠️  Réponse inattendue: ${result.status} ${result.statusMessage}`, 'yellow');
      }
    } else {
      log(`   ❌ Service inaccessible: ${result.error}`, 'red');
    }
  }

  console.log();
  log('═══════════════════════════════════════════════════════════', 'bright');
  log('\n💡 Conseils:', 'cyan');
  log('   1. Le serveur Python doit être démarré:', 'blue');
  log('      cd deep-darts-master && python serve.py', 'blue');
  log('   2. Votre téléphone et serveur doivent être sur le même WiFi', 'blue');
  log('   3. Vérifiez le pare-feu de votre ordinateur', 'blue');
  log('   4. Testez avec: curl http://[IP]:8000/api/detect\n', 'blue');
}

main().catch((error) => {
  log(`\n❌ Erreur: ${error.message}`, 'red');
  process.exit(1);
});
