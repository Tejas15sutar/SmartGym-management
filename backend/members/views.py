from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Member
from .serializers import MemberSerializer


class MemberProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        member, created = Member.objects.get_or_create(
            user=self.request.user
        )

        return member