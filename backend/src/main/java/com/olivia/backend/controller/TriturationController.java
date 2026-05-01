package com.olivia.backend.controller;

import com.olivia.backend.model.Trituration;
import com.olivia.backend.service.TriturationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/triturations")
@CrossOrigin(origins = "*")
public class TriturationController {

    @Autowired
    private TriturationService triturationService;

    @GetMapping
    public List<Trituration> getAll() {
        return triturationService.getAllTriturations();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trituration> getById(@PathVariable String id) {
        return triturationService.getTriturationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Trituration create(@RequestBody Trituration trituration) {
        return triturationService.saveTrituration(trituration);
    }

    @PutMapping("/{id}")
    public Trituration update(@PathVariable String id, @RequestBody Trituration trituration) {
        trituration.setId(id);
        return triturationService.saveTrituration(trituration);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        triturationService.deleteTrituration(id);
        return ResponseEntity.ok().build();
    }
}
