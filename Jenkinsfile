pipeline {
  agent any

  environment {
    DOCKERHUB_USER = 'vanujak'
    BACKEND_IMAGE = 'vanujak/easycase-backend:latest'
    FRONTEND_IMAGE = 'vanujak/easycase-frontend:latest'
  }

  stages {

    stage('Checkout Code from GitHub') {
      steps {
        echo "🔄 Pulling latest EasyCase project from GitHub..."
        git branch: 'main', url: 'https://github.com/vanujak/easycase-demo.git'
      }
    }

    stage('Build Backend Docker Image') {
      steps {
        echo "🐳 Building backend Docker image..."
        sh '''
          docker build -t ${BACKEND_IMAGE} backend/
        '''
      }
    }

    stage('Build Frontend Docker Image') {
      steps {
        echo "🐳 Building frontend Docker image..."
        sh '''
          docker build -t ${FRONTEND_IMAGE} frontend/
        '''
      }
    }

    stage('Login to Docker Hub') {
      steps {
        echo "🔑 Logging in to Docker Hub..."
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
        }
      }
    }

    stage('Push Images to Docker Hub') {
      steps {
        echo "⬆️ Pushing Docker images to Docker Hub..."
        sh '''
          docker push ${BACKEND_IMAGE}
          docker push ${FRONTEND_IMAGE}
        '''
      }
    }
  }

  post {
    success {
      echo "✅ Build and Push completed successfully!"
    }
    failure {
      echo "❌ Pipeline failed. Check logs for details."
    }
  }
}
