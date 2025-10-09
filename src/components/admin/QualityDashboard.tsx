import { useState, useEffect } from 'react';
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Code, 
  TestTube,
  Zap,
  RefreshCw,
  Download
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { codeQualityAnalyzer, QualityMetrics, QualityIssue } from '@/lib/quality/code-quality';

export default function QualityDashboard() {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadQualityData();
  }, []);

  const loadQualityData = async () => {
    try {
      setIsLoading(true);
      const report = await codeQualityAnalyzer.generateQualityReport();
      
      setMetrics(report.metrics);
      setIssues(report.issues);
      setRecommendations(report.recommendations);
      setOverallScore(report.overallScore);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading quality data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportQualityReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      overallScore,
      metrics,
      issues,
      recommendations
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quality_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getIssueIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default: return <CheckCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Qualité du Code</h1>
          <p className="text-sm text-gray-600">
            Dernière analyse : {lastUpdate.toLocaleString('fr-FR')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={loadQualityData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={exportQualityReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Score global */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore.toFixed(0)}
          </div>
          <h2 className="text-xl font-semibold mt-4 mb-2">Score de Qualité Global</h2>
          <p className="text-gray-600">
            {overallScore >= 90 ? '🌟 Excellente qualité' :
             overallScore >= 70 ? '👍 Bonne qualité' :
             '⚠️ Amélioration nécessaire'}
          </p>
        </div>
      </div>

      {/* Métriques détaillées */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <TestTube className="w-6 h-6 text-blue-600" />
              <span className={`text-2xl font-bold ${getScoreColor(metrics.testCoverage)}`}>
                {metrics.testCoverage.toFixed(0)}%
              </span>
            </div>
            <h3 className="font-medium text-gray-900">Couverture de Tests</h3>
            <p className="text-sm text-gray-600 mt-1">
              {metrics.testCoverage >= 80 ? 'Excellente couverture' : 'Amélioration recommandée'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-6 h-6 text-green-600" />
              <span className={`text-2xl font-bold ${getScoreColor(metrics.performanceScore)}`}>
                {metrics.performanceScore.toFixed(0)}
              </span>
            </div>
            <h3 className="font-medium text-gray-900">Performance</h3>
            <p className="text-sm text-gray-600 mt-1">
              Score de performance global
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
              <span className={`text-2xl font-bold ${getScoreColor(metrics.securityScore)}`}>
                {metrics.securityScore.toFixed(0)}
              </span>
            </div>
            <h3 className="font-medium text-gray-900">Sécurité</h3>
            <p className="text-sm text-gray-600 mt-1">
              Analyse de sécurité du code
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <Code className="w-6 h-6 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">
                {metrics.codeComplexity.toFixed(0)}
              </span>
            </div>
            <h3 className="font-medium text-gray-900">Complexité</h3>
            <p className="text-sm text-gray-600 mt-1">
              {metrics.codeComplexity < 10 ? 'Faible complexité' : 
               metrics.codeComplexity < 20 ? 'Complexité modérée' : 'Complexité élevée'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              <span className={`text-2xl font-bold ${getScoreColor(metrics.maintainabilityIndex)}`}>
                {metrics.maintainabilityIndex.toFixed(0)}
              </span>
            </div>
            <h3 className="font-medium text-gray-900">Maintenabilité</h3>
            <p className="text-sm text-gray-600 mt-1">
              Index de maintenabilité
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <span className="text-2xl font-bold text-red-600">
                {metrics.technicalDebt.toFixed(0)}%
              </span>
            </div>
            <h3 className="font-medium text-gray-900">Dette Technique</h3>
            <p className="text-sm text-gray-600 mt-1">
              {metrics.technicalDebt < 10 ? 'Faible dette' : 
               metrics.technicalDebt < 20 ? 'Dette modérée' : 'Dette élevée'}
            </p>
          </div>
        </div>
      )}

      {/* Problèmes identifiés */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium mb-4">Problèmes Identifiés</h2>
        <div className="space-y-4">
          {issues.map((issue, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              {getIssueIcon(issue.severity)}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-medium text-gray-900">{issue.message}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    issue.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {issue.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{issue.file}{issue.line && `:${issue.line}`}</p>
                <p className="text-sm text-blue-600">{issue.suggestion}</p>
              </div>
            </div>
          ))}
          {issues.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">Aucun problème critique identifié</p>
            </div>
          )}
        </div>
      </div>

      {/* Recommandations */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium mb-4">Recommandations d'Amélioration</h2>
        <div className="space-y-3">
          {recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-800">{recommendation}</p>
            </div>
          ))}
          {recommendations.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-600">Aucune recommandation pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}