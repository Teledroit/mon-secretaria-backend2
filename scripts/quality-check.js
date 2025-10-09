#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class QualityChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  async runQualityChecks() {
    console.log('🔍 Démarrage des vérifications de qualité...\n');

    try {
      await this.checkLinting();
      await this.runTests();
      await this.checkCoverage();
      await this.checkBundleSize();
      await this.checkSecurity();
      await this.checkPerformance();

      this.generateReport();
    } catch (error) {
      console.error('❌ Erreur lors des vérifications:', error);
      process.exit(1);
    }
  }

  async checkLinting() {
    console.log('📝 Vérification du linting...');
    
    try {
      execSync('npm run lint', { stdio: 'pipe' });
      console.log('✅ Linting: Aucun problème détecté');
    } catch (error) {
      this.errors.push('Erreurs de linting détectées');
      console.log('❌ Linting: Erreurs détectées');
    }
  }

  async runTests() {
    console.log('🧪 Exécution des tests...');
    
    try {
      const output = execSync('npm run test:coverage', { encoding: 'utf8' });
      console.log('✅ Tests: Tous les tests passent');
      
      // Extraire le pourcentage de couverture
      const coverageMatch = output.match(/All files\s+\|\s+(\d+\.?\d*)/);
      if (coverageMatch) {
        const coverage = parseFloat(coverageMatch[1]);
        if (coverage < 80) {
          this.warnings.push(`Couverture de tests faible: ${coverage}%`);
        }
      }
    } catch (error) {
      this.errors.push('Échec des tests');
      console.log('❌ Tests: Échecs détectés');
    }
  }

  async checkCoverage() {
    console.log('📊 Vérification de la couverture...');
    
    try {
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        const totalCoverage = coverage.total.lines.pct;
        
        if (totalCoverage >= 80) {
          console.log(`✅ Couverture: ${totalCoverage}% (Excellent)`);
        } else if (totalCoverage >= 60) {
          console.log(`⚠️ Couverture: ${totalCoverage}% (Acceptable)`);
          this.warnings.push(`Couverture de tests: ${totalCoverage}%`);
        } else {
          console.log(`❌ Couverture: ${totalCoverage}% (Insuffisant)`);
          this.errors.push(`Couverture de tests insuffisante: ${totalCoverage}%`);
        }
      }
    } catch (error) {
      this.warnings.push('Impossible de vérifier la couverture');
    }
  }

  async checkBundleSize() {
    console.log('📦 Vérification de la taille du bundle...');
    
    try {
      execSync('npm run build', { stdio: 'pipe' });
      
      const distPath = path.join(process.cwd(), 'dist');
      if (fs.existsSync(distPath)) {
        const stats = this.getDirectorySize(distPath);
        const sizeMB = stats / (1024 * 1024);
        
        if (sizeMB < 5) {
          console.log(`✅ Bundle: ${sizeMB.toFixed(2)}MB (Optimal)`);
        } else if (sizeMB < 10) {
          console.log(`⚠️ Bundle: ${sizeMB.toFixed(2)}MB (Acceptable)`);
          this.warnings.push(`Taille du bundle: ${sizeMB.toFixed(2)}MB`);
        } else {
          console.log(`❌ Bundle: ${sizeMB.toFixed(2)}MB (Trop volumineux)`);
          this.errors.push(`Bundle trop volumineux: ${sizeMB.toFixed(2)}MB`);
        }
      }
    } catch (error) {
      this.warnings.push('Impossible de vérifier la taille du bundle');
    }
  }

  async checkSecurity() {
    console.log('🔒 Vérification de sécurité...');
    
    try {
      // Vérifier les variables d'environnement sensibles
      const envFile = path.join(process.cwd(), '.env');
      if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf8');
        
        // Vérifier que les clés API ne sont pas exposées
        if (envContent.includes('sk-') || envContent.includes('pk_')) {
          this.warnings.push('Clés API détectées dans .env - Vérifiez la sécurité');
        }
      }

      // Vérifier les dépendances vulnérables
      try {
        execSync('npm audit --audit-level=high', { stdio: 'pipe' });
        console.log('✅ Sécurité: Aucune vulnérabilité critique');
      } catch (auditError) {
        this.warnings.push('Vulnérabilités détectées dans les dépendances');
      }

    } catch (error) {
      this.warnings.push('Impossible de vérifier la sécurité');
    }
  }

  async checkPerformance() {
    console.log('⚡ Vérification des performances...');
    
    try {
      // Analyser les fichiers volumineux
      const srcPath = path.join(process.cwd(), 'src');
      const largeFiles = this.findLargeFiles(srcPath, 200 * 1024); // 200KB
      
      if (largeFiles.length > 0) {
        this.warnings.push(`Fichiers volumineux détectés: ${largeFiles.length}`);
        largeFiles.forEach(file => {
          console.log(`⚠️ Fichier volumineux: ${file.path} (${(file.size / 1024).toFixed(1)}KB)`);
        });
      } else {
        console.log('✅ Performance: Taille des fichiers optimale');
      }

    } catch (error) {
      this.warnings.push('Impossible de vérifier les performances');
    }
  }

  getDirectorySize(dirPath) {
    let totalSize = 0;
    
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += this.getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  }

  findLargeFiles(dirPath, maxSize) {
    const largeFiles = [];
    
    const scanDirectory = (dir) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          scanDirectory(filePath);
        } else if (stats.size > maxSize) {
          largeFiles.push({
            path: path.relative(process.cwd(), filePath),
            size: stats.size
          });
        }
      }
    };
    
    scanDirectory(dirPath);
    return largeFiles;
  }

  generateReport() {
    console.log('\n📋 RAPPORT DE QUALITÉ');
    console.log('='.repeat(50));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 Excellente qualité ! Aucun problème détecté.');
    } else {
      if (this.errors.length > 0) {
        console.log('\n❌ ERREURS CRITIQUES:');
        this.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
      
      if (this.warnings.length > 0) {
        console.log('\n⚠️ AVERTISSEMENTS:');
        this.warnings.forEach((warning, index) => {
          console.log(`  ${index + 1}. ${warning}`);
        });
      }
    }

    console.log('\n📈 RECOMMANDATIONS:');
    console.log('  • Exécutez les tests régulièrement');
    console.log('  • Maintenez une couverture de tests > 80%');
    console.log('  • Surveillez la taille du bundle');
    console.log('  • Mettez à jour les dépendances régulièrement');
    
    console.log('\n' + '='.repeat(50));
    
    // Exit avec code d'erreur si des erreurs critiques
    if (this.errors.length > 0) {
      process.exit(1);
    }
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new QualityChecker();
  checker.runQualityChecks();
}