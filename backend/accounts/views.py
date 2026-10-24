from .models import User
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum
from django.utils import timezone
from memberships.models import Membership
from payments.models import Payment
from rest_framework import viewsets
from .serializers import AdminUserSerializer
from .serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
)
from .permissions import (
    IsAdmin,
    IsTrainer,
    IsMember,
    IsReceptionist,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "role": user.role,
        })
        
class MemberListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ["ADMIN", "RECEPTIONIST"]:
            return Response(
                {"detail": "Only Admin and Receptionist can view members."},
                status=403
            )

        members = User.objects.filter(
            role="MEMBER"
        ).values(
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone",
        )

        return Response(members)

class AdminTestView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response({
            "message": "Welcome Admin",
            "role": request.user.role
        })


class TrainerTestView(APIView):
    permission_classes = [IsTrainer]

    def get(self, request):
        return Response({
            "message": "Welcome Trainer",
            "role": request.user.role
        })


class MemberTestView(APIView):
    permission_classes = [IsMember]

    def get(self, request):
        return Response({
            "message": "Welcome Member",
            "role": request.user.role
        })


class ReceptionistTestView(APIView):
    permission_classes = [IsReceptionist]

    def get(self, request):
        return Response({
            "message": "Welcome Receptionist",
            "role": request.user.role
        })
        
class AdminDashboardStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        today = timezone.localdate()

        total_members = User.objects.filter(
            role="MEMBER"
        ).count()

        total_trainers = User.objects.filter(
            role="TRAINER"
        ).count()

        active_memberships = Membership.objects.filter(
            status="ACTIVE",
            start_date__lte=today,
            end_date__gte=today,
        ).count()

        total_payments = Payment.objects.filter(
            payment_status="SUCCESSFUL"
        ).aggregate(
            total=Sum("amount")
        )["total"] or 0

        return Response({
            "total_members": total_members,
            "total_trainers": total_trainers,
            "active_memberships": active_memberships,
            "total_payments": total_payments,
        })

class AdminUserViewSet(viewsets.ModelViewSet):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        queryset = User.objects.all().order_by("role", "username")

        role = self.request.query_params.get("role")

        allowed_roles = [
            "ADMIN",
            "TRAINER",
            "MEMBER",
            "RECEPTIONIST",
        ]

        if role in allowed_roles:
            queryset = queryset.filter(role=role)

        return queryset