package br.com.nucleo.api.shopping;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shopping")
public class ShoppingController {

    private final ShoppingService shoppingService;

    public ShoppingController(
            ShoppingService shoppingService
    ) {
        this.shoppingService = shoppingService;
    }

    @PostMapping("/lists")
    public ResponseEntity<ShoppingListDetailsResponse> createList(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody
            CreateShoppingListRequest request
    ) {
        ShoppingListDetailsResponse response =
                shoppingService.createList(
                        userId(jwt),
                        request
                );

        return ResponseEntity
                .created(
                        URI.create(
                                "/api/shopping/lists/"
                                        + response.id()
                        )
                )
                .body(response);
    }

    @GetMapping("/lists")
    public List<ShoppingListSummaryResponse> listLists(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false)
            ShoppingListStatus status
    ) {
        return shoppingService.listLists(
                userId(jwt),
                status
        );
    }

    @GetMapping("/lists/{listId}")
    public ShoppingListDetailsResponse findListById(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId
    ) {
        return shoppingService.findListById(
                userId(jwt),
                listId
        );
    }

    @PutMapping("/lists/{listId}")
    public ShoppingListDetailsResponse updateList(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId,
            @Valid @RequestBody
            UpdateShoppingListRequest request
    ) {
        return shoppingService.updateList(
                userId(jwt),
                listId,
                request
        );
    }

    @PatchMapping("/lists/{listId}/complete")
    public ShoppingListDetailsResponse completeList(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId
    ) {
        return shoppingService.completeList(
                userId(jwt),
                listId
        );
    }

    @PatchMapping("/lists/{listId}/reopen")
    public ShoppingListDetailsResponse reopenList(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId
    ) {
        return shoppingService.reopenList(
                userId(jwt),
                listId
        );
    }

    @PatchMapping("/lists/{listId}/archive")
    public ShoppingListDetailsResponse archiveList(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId
    ) {
        return shoppingService.archiveList(
                userId(jwt),
                listId
        );
    }

    @DeleteMapping("/lists/{listId}")
    public ResponseEntity<Void> deleteList(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId
    ) {
        shoppingService.deleteList(
                userId(jwt),
                listId
        );

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/lists/{listId}/items")
    public ResponseEntity<ShoppingItemResponse> createItem(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId,
            @Valid @RequestBody
            CreateShoppingItemRequest request
    ) {
        ShoppingItemResponse response =
                shoppingService.createItem(
                        userId(jwt),
                        listId,
                        request
                );

        return ResponseEntity
                .created(
                        URI.create(
                                "/api/shopping/lists/"
                                        + listId
                                        + "/items/"
                                        + response.id()
                        )
                )
                .body(response);
    }

    @PutMapping("/lists/{listId}/items/{itemId}")
    public ShoppingItemResponse updateItem(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId,
            @PathVariable UUID itemId,
            @Valid @RequestBody
            UpdateShoppingItemRequest request
    ) {
        return shoppingService.updateItem(
                userId(jwt),
                listId,
                itemId,
                request
        );
    }

    @PatchMapping(
            "/lists/{listId}/items/{itemId}/purchase"
    )
    public ShoppingItemResponse markItemAsPurchased(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId,
            @PathVariable UUID itemId,
            @Valid
            @RequestBody(required = false)
            MarkShoppingItemPurchasedRequest request
    ) {
        return shoppingService.markItemAsPurchased(
                userId(jwt),
                listId,
                itemId,
                request
        );
    }

    @PatchMapping(
            "/lists/{listId}/items/{itemId}/pending"
    )
    public ShoppingItemResponse markItemAsPending(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId,
            @PathVariable UUID itemId
    ) {
        return shoppingService.markItemAsPending(
                userId(jwt),
                listId,
                itemId
        );
    }

    @PatchMapping(
            "/lists/{listId}/items/{itemId}/cancel"
    )
    public ShoppingItemResponse cancelItem(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId,
            @PathVariable UUID itemId
    ) {
        return shoppingService.cancelItem(
                userId(jwt),
                listId,
                itemId
        );
    }

    @PatchMapping(
            "/lists/{listId}/items/{itemId}/restore"
    )
    public ShoppingItemResponse restoreItem(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId,
            @PathVariable UUID itemId
    ) {
        return shoppingService.restoreItem(
                userId(jwt),
                listId,
                itemId
        );
    }

    @DeleteMapping(
            "/lists/{listId}/items/{itemId}"
    )
    public ResponseEntity<Void> deleteItem(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID listId,
            @PathVariable UUID itemId
    ) {
        shoppingService.deleteItem(
                userId(jwt),
                listId,
                itemId
        );

        return ResponseEntity.noContent().build();
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}