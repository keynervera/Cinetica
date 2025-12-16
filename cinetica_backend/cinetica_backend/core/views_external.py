from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from core.services.cinetica_external_service import CineticaExternalService
from core.repositories.external_content_repository import save_external_content

from core.repositories.external_content_repository import (
    save_external_content,
    list_external_contents,
    get_external_content,
    update_external_content,
    delete_external_content,
)

@api_view(["GET"])
def search_external_content(request):
    """
    Endpoint que consume la API externa y devuelve resultados normalizados
    """
    query = request.query_params.get("q")

    if not query:
        return Response(
            {"error": "El parámetro 'q' es obligatorio"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        results = CineticaExternalService.search_content(query)

        formatted = []
        for item in results:
            show = item.get("show", {})
            formatted.append({
                "title": show.get("name"),
                "summary": show.get("summary"),
                "rating": (show.get("rating") or {}).get("average"),
                "image": (show.get("image") or {}).get("medium"),
                "language": show.get("language"),
                "premiered": show.get("premiered"),
            })

        return Response(formatted, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {
                "error": "Error al consumir la API externa",
                "detail": str(e)
            },
            status=status.HTTP_502_BAD_GATEWAY
        )

@api_view(["POST"])
def save_external_content_view(request):
    if not request.data:
        return Response(
            {"error": "No se enviaron datos"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        inserted_id = save_external_content(request.data)
        return Response(
            {"message": "Contenido guardado", "id": inserted_id},
            status=status.HTTP_201_CREATED
        )
    except Exception as e:
        return Response(
            {"error": "Error guardando en MongoDB", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(["GET"])
def list_external_content_view(request):
    """
    Listar todos los contenidos guardados en MongoDB
    """
    contents = list_external_contents()
    return Response(contents, status=status.HTTP_200_OK)


@api_view(["GET"])
def external_content_detail_view(request, doc_id):
    """
    Obtener detalle de un contenido específico por su ID
    """
    content = get_external_content(doc_id)
    if not content:
        return Response({"error": "Contenido no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    return Response(content, status=status.HTTP_200_OK)


@api_view(["GET", "PUT", "DELETE"])
def external_content_detail_view(request, doc_id):
    doc = get_external_content(doc_id)
    if not doc:
        return Response({"error": "No encontrado"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(doc, status=status.HTTP_200_OK)

    if request.method == "PUT":
        if not request.data:
            return Response({"error": "Body requerido"}, status=status.HTTP_400_BAD_REQUEST)

        ok = update_external_content(doc_id, request.data)
        return Response({"message": "Actualizado"} if ok else {"error": "No se pudo actualizar"},
                        status=status.HTTP_200_OK if ok else status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(["DELETE"])
def delete_external_content_view(request, doc_id):
    """
    Eliminar un contenido específico por su ID
    """
    content = get_external_content(doc_id)
    if not content:
        return Response({"error": "Contenido no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    
    if delete_external_content(doc_id):
        return Response({"message": "Contenido eliminado correctamente"}, status=status.HTTP_204_NO_CONTENT)
    
    return Response({"error": "No se pudo eliminar"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)